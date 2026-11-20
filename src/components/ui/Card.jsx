// Card slots follow the composable shadcn/ui Card API.
export function Card({ as: Root = "article", ...props }) {
  return <Root data-slot="card" className="card" {...props} />;
}

export function CardContent({ children }) {
  return <div data-slot="card-content" className="card-body">{children}</div>;
}

export function CardFooter({ children }) {
  return <footer data-slot="card-footer" className="card-actions">{children}</footer>;
}
