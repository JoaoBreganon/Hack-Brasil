import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-3xl">Aloca</CardTitle>
            <Badge variant="secondary">PDDE</Badge>
          </div>
          <CardDescription className="text-base">
            Nenhuma escola perde o que já é dela.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            O Aloca ajuda escolas a planejar os gastos do PDDE antes do prazo,
            para que o recurso não volte para o governo.
          </p>
          <div>
            <Button disabled>Em breve</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
