import styles from './Loading.module.css'

interface LoadingProps {
  extraStyleClasses?: string[]
}

const Loading = ({ extraStyleClasses = [] }: LoadingProps) => {
  const styleClasses = [styles.ldsDualRing, ...extraStyleClasses].join(' ')

  return (
    <div
      className={styleClasses}
      data-testid="loading"
    ></div>
  )
}

export default Loading
