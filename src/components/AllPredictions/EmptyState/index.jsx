import CommonEmptyState from '../../Common/EmptyState'

const EmptyState = ({ icon, title, description }) => {
  return (
    <CommonEmptyState
      icon={icon}
      title={title}
      description={description}
      style={{ padding: '48px 16px' }}
      iconStyle={{ fontSize: '3rem' }}
      descriptionStyle={{ lineHeight: 1.6, maxWidth: '500px', margin: '0 auto' }}
    />
  )
}

export default EmptyState
