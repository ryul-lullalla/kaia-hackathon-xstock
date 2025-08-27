import { Faucet } from "@/components/faucet";
import { UsdtFaucet } from "@/components/usdt-faucet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FaucetPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Token Faucet
        </h1>
        <p className="text-lg text-muted-foreground">
          Get free tokens to start using the xStock protocol. Choose between
          kxAPPLE tokens for liquidity or USDT for collateral.
        </p>
      </div>

      <Tabs defaultValue="kxapple" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="kxapple">KX Apple Faucet</TabsTrigger>
          <TabsTrigger value="usdt">USDT Faucet</TabsTrigger>
        </TabsList>

        <TabsContent value="kxapple" className="space-y-6">
          <div className="flex justify-center">
            <Faucet />
          </div>

          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-xl font-semibold mb-4">
              How to use KX Apple Faucet
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Connect your wallet using the button in the header</li>
              <li>
                Enter the amount of kxApple tokens you want to mint (max 1000)
              </li>
              <li>Click "Mint Tokens" and confirm the transaction</li>
              <li>Your tokens will appear in your wallet after confirmation</li>
              <li>Use kxApple tokens to provide liquidity and earn yield</li>
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="usdt" className="space-y-6">
          <div className="flex justify-center">
            <UsdtFaucet />
          </div>

          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-xl font-semibold mb-4">
              How to use USDT Faucet
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Connect your wallet using the button in the header</li>
              <li>
                Enter the amount of USDT tokens you want to mint (max 1000)
              </li>
              <li>Click "Mint Tokens" and confirm the transaction</li>
              <li>Your tokens will appear in your wallet after confirmation</li>
              <li>Use USDT tokens as collateral for borrowing</li>
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
