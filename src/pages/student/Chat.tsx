import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentChat() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-16 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Mensagens</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            O sistema de mensagens estará disponível em breve. 
            Poderá comunicar diretamente com o seu Personal Trainer e a empresa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
