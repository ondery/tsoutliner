/** @jsxImportSource react */
export function Button({ label, onClick }) {
  return (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  );
}

export class Panel {
  render() {
    return <div className="panel">Panel</div>;
  }
}

export default function App() {
  return <Button label="Click" onClick={() => undefined} />;
}
