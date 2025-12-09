import { DeveloperFooter } from "@/components/DeveloperFooter";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
          <a href="/" className="text-primary underline hover:text-primary/90">Voltar ao Início</a>
        </div>
      </div>
      <DeveloperFooter />
    </div>
  );
};

export default NotFound;
