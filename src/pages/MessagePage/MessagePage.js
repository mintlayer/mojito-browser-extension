import React, { useState } from 'react'

import { Message } from '@ContainerComponents'
import { PageWrapper } from '@BasicComponents'

import './MessagePage.css'

const MessagePage = () => {
  const [activeTab, setActiveTab] = useState('sign')

  return (
    <PageWrapper>
      <div className="tabs">
        <button
          onClick={() => setActiveTab('sign')}
          className={`message-tabs-button ${activeTab === 'sign' ? 'active' : ''}`}
        >
          Sign Message
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`message-tabs-button ${activeTab === 'verify' ? 'active' : ''}`}
        >
          Verify Message
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'sign' ? (
          <Message.SignMessage />
        ) : (
          <Message.VerifyMessage />
        )}
      </div>
    </PageWrapper>
  )
}

export default MessagePage
