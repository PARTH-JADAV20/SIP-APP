// In processSIPs.js
export async function processSIPs() {
  const db = await getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find all active SIPs due for processing
  const sips = await db.collection('sip_investments').find({
    status: 'active',
    nextDebitDate: { $lte: today }
  }).toArray();

  for (const sip of sips) {
    const session = db.client.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 1. Get current NAV
        const navResponse = await fetch(`https://api.mfapi.in/mf/${sip.schemeCode}`);
        if (!navResponse.ok) {
          throw new Error(`Failed to fetch NAV for scheme ${sip.schemeCode}`);
        }
        const navData = await navResponse.json();
        const currentNav = parseFloat(navData.data[0].nav);
        const schemeName = navData.meta?.scheme_name || sip.schemeName;

        // 2. Calculate units to allot
        const unitsAllotted = sip.amount / currentNav;

        // 3. Update portfolio
        const portfolio = await db.collection('virtual_portfolio').findOne(
          { _id: sip.portfolioId },
          { session }
        );

        if (!portfolio) {
          throw new Error('Portfolio not found');
        }

        if (portfolio.balance < sip.amount) {
          throw new Error('Insufficient balance for SIP');
        }

        // Find or create fund in portfolio
        const fundIndex = portfolio.funds.findIndex(
          f => f.schemeCode === sip.schemeCode
        );

        let updatedFund;
        if (fundIndex >= 0) {
          // Update existing fund
          const fund = portfolio.funds[fundIndex];
          const newUnits = (fund.units || 0) + unitsAllotted;
          const newInvested = (fund.investedAmount || 0) + sip.amount;
          const newAverageNav = newInvested / newUnits;
          
          updatedFund = {
            ...fund,
            units: newUnits,
            averageNav: newAverageNav,
            investedAmount: newInvested,
            currentValue: newUnits * currentNav,
            lastUpdated: new Date()
          };
          portfolio.funds[fundIndex] = updatedFund;
        } else {
          // Add new fund
          updatedFund = {
            schemeCode: sip.schemeCode,
            schemeName,
            units: unitsAllotted,
            averageNav: currentNav,
            investedAmount: sip.amount,
            currentValue: sip.amount,
            lastUpdated: new Date()
          };
          portfolio.funds.push(updatedFund);
        }

        // 4. Add transaction
        const transaction = {
          type: 'SIP',
          amount: sip.amount,
          schemeCode: sip.schemeCode,
          schemeName,
          units: unitsAllotted,
          nav: currentNav,
          date: new Date(),
          status: 'COMPLETED',
          sipId: sip._id,
          notes: 'Monthly SIP investment'
        };
        portfolio.transactions.push(transaction);

        // 5. Update portfolio balance
        portfolio.balance -= sip.amount;
        portfolio.updatedAt = new Date();

        // 6. Save portfolio
        await db.collection('virtual_portfolio').updateOne(
          { _id: portfolio._id },
          {
            $set: {
              funds: portfolio.funds,
              transactions: portfolio.transactions,
              balance: portfolio.balance,
              updatedAt: portfolio.updatedAt
            }
          },
          { session }
        );

        // 7. Update SIP record
        const nextDebitDate = new Date(today);
        nextDebitDate.setMonth(nextDebitDate.getMonth() + 1);
        
        await db.collection('sip_investments').updateOne(
          { _id: sip._id },
          {
            $set: {
              nextDebitDate,
              lastDebitDate: today,
              unitsAllotted: (sip.unitsAllotted || 0) + unitsAllotted,
              totalInvested: (sip.totalInvested || 0) + sip.amount,
              updatedAt: new Date()
            },
            $push: {
              transactions: {
                date: new Date(),
                amount: sip.amount,
                nav: currentNav,
                units: unitsAllotted
              }
            }
          },
          { session }
        );

        console.log(`Processed SIP ${sip._id} for portfolio ${portfolio._id}`);
      });
      
    } catch (error) {
      console.error(`Error processing SIP ${sip._id}:`, error);
      
      // Log failed transaction
      await db.collection('virtual_portfolio').updateOne(
        { _id: sip.portfolioId },
        {
          $push: {
            transactions: {
              type: 'SIP',
              amount: sip.amount,
              schemeCode: sip.schemeCode,
              schemeName: sip.schemeName,
              date: new Date(),
              status: 'FAILED',
              sipId: sip._id,
              notes: `Failed: ${error.message}`
            }
          }
        }
      );
      
    } finally {
      await session.endSession();
    }
  }
};
