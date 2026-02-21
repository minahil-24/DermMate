const Skeleton = ({ className = '', variant = 'default' }) => {
  const variants = {
    default: 'h-4 bg-gray-200 rounded animate-pulse',
    card: 'h-48 bg-gray-200 rounded-lg animate-pulse',
    avatar: 'w-12 h-12 bg-gray-200 rounded-full animate-pulse',
    text: 'h-4 bg-gray-200 rounded animate-pulse',
    title: 'h-6 bg-gray-200 rounded animate-pulse',
  }

  return <div className={`${variants[variant]} ${className}`} />
}

export default Skeleton
