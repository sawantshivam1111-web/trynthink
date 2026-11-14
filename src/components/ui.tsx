export function Button({ children, onClick, variant = "primary", disabled, type = "button" }: any) {
  const cls = variant === "secondary" ? "btn btn-secondary" : variant === "ghost" ? "btn btn-ghost" : "btn"
  return (
    <button className={cls} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  )
}

export function Card({ children, title }: any) {
  return (
    <div className="card">
      {title ? <h3 className="card-title">{title}</h3> : null}
      {children}
    </div>
  )
}

export function Input(props: any) {
  return <input className="input" {...props} />
}

export function TextArea(props: any) {
  return <textarea className="input" {...props} />
}