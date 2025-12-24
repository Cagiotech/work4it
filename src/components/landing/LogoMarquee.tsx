const logos = [
  'Nike', 'Adidas', 'Puma', 'Under Armour', 'Reebok', 'New Balance',
  'Fitness First', 'Gold\'s Gym', 'Planet Fitness', 'Anytime Fitness',
  'CrossFit', 'Orange Theory', 'Equinox', 'LA Fitness', 'YMCA', '24 Hour Fitness'
];

export function LogoMarquee() {
  return (
    <div className="relative w-full overflow-hidden bg-background/95 py-6 border-y border-border/30">
      <div className="flex animate-[marquee_30s_linear_infinite]">
        {[...logos, ...logos].map((logo, index) => (
          <div
            key={index}
            className="flex-shrink-0 mx-8 text-lg font-bold text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            {logo}
          </div>
        ))}
      </div>
    </div>
  );
}
