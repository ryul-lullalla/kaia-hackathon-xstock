import { Faucet } from "@/components/faucet";

export default function FaucetPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          KX Apple Faucet
        </h1>
        <p className="text-lg text-muted-foreground">
          Get free kxApple tokens to start using the xStock protocol. These
          tokens can be used to provide liquidity and earn yield.
        </p>
      </div>

      <div className="flex justify-center">
        <Faucet />
      </div>

      <div className="mt-8 p-6 rounded-lg bg-card border border-border">
        <h3 className="text-xl font-semibold mb-4">How to use the Faucet</h3>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Connect your wallet using the button in the header</li>
          <li>
            Enter the amount of kxApple tokens you want to mint (max 1000)
          </li>
          <li>Click "Mint Tokens" and confirm the transaction</li>
          <li>Your tokens will appear in your wallet after confirmation</li>
        </ol>
      </div>
    </div>
  );
}
