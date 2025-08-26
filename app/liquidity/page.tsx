import { LiquidityProvider } from "@/components/liquidity-provider";

export default function LiquidityPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Liquidity Provision
        </h1>
        <p className="text-lg text-muted-foreground">
          Provide kxApple liquidity to the lending pool and earn passive income
          from borrower interest payments.
        </p>
      </div>

      <div className="flex justify-center">
        <LiquidityProvider />
      </div>

      <div className="mt-8 space-y-6">
        <div className="p-6 rounded-lg bg-card border border-border">
          <h3 className="text-xl font-semibold mb-4">
            Earn by Providing Liquidity
          </h3>
          <div className="space-y-3 text-muted-foreground">
            <p>
              As a liquidity provider, you earn interest from borrowers who pay
              fees to borrow kxApple tokens from the pool.
            </p>
            <p>
              <strong>Current APY:</strong> ~5.2% (varies based on utilization
              rate)
            </p>
            <p>
              <strong>Vault Shares:</strong> You receive vault shares
              representing your portion of the pool, which automatically earn
              compound interest.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card border border-border">
          <h3 className="text-xl font-semibold mb-4">
            How to Provide Liquidity
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Make sure you have kxApple tokens (get them from the faucet)
            </li>
            <li>Enter the amount you want to supply</li>
            <li>Click "Approve kxApple" and confirm the transaction</li>
            <li>Click "Supply Liquidity" and confirm the transaction</li>
            <li>
              You'll receive vault shares and start earning interest immediately
            </li>
          </ol>
        </div>

        <div className="p-6 rounded-lg bg-primary/10 border border-primary/20">
          <h3 className="text-xl font-semibold mb-4 text-primary">
            Risk Information
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Liquidity provision involves smart contract risk</p>
            <p>• Interest rates may fluctuate based on market conditions</p>
            <p>
              • You can withdraw your liquidity at any time (subject to
              availability)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
