import React, { forwardRef, useCallback } from 'react'
import styles from './TabButton.module.css'

const TabButton = forwardRef(function TabButton({ tab, isActive, isCompact, onClick }, ref) {
  const handleClick = useCallback(() => {
    onClick(tab.id)
  }, [tab.id, onClick])

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick(tab.id)
      }
    },
    [tab.id, onClick]
  )

  const clases = [styles.button, isActive && styles.active, isCompact && styles.compact]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={ref}
      id={`tab-${tab.id}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${tab.id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={clases}
      aria-label={`${tab.label}, ${isActive ? 'seleccionado' : 'no seleccionado'}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {tab.icon}
      </span>
      <span className={styles.labelDesktop}>{tab.label}</span>
      <span className={styles.labelMobile}>{tab.mobileLabel || tab.label}</span>
    </button>
  )
})

export default React.memo(TabButton)
