import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children?: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function App(): JSX.Element {
  return <Card title="TS Outliner">Works with TSX</Card>;
}
