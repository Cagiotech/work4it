import logo from '@/assets/logo-light.png';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Cagiotech" className="h-8 w-auto" />
            <span className="font-heading text-lg font-bold text-foreground">
              Cagiotech
            </span>
          </Link>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cagiotech. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
