import { MessageSquare } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <MessageSquare className="h-8 w-8" />
      <p>Görüntülemek için bir sohbet seç.</p>
    </div>
  );
}
