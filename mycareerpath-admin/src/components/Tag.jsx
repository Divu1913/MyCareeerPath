export default function Tag({ tone = 'flat', children }) {
  return <span className={`tag tag-${tone}`}>{children}</span>
}
