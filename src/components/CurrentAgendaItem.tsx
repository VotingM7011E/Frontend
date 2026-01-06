import React from 'react';
import MotionManager from './MotionManager';
import ElectionManager from './ElectionManager';

interface AgendaItem {
  type: 'election' | 'motion' | 'info';
  title: string;
  description?: string;
  positions?: string[];
  baseMotions?: Array<{ owner: string; motion: string }>;
  motion_item_id?: string;
}

interface CurrentAgendaItemProps {
  meetingId: string;
  currentItem: AgendaItem | null;
  currentItemIndex: number;  // Add this to pass to ElectionManager
  className?: string;
  hasManagePermission?: boolean;
}

const CurrentAgendaItem: React.FC<CurrentAgendaItemProps> = ({ 
  meetingId, 
  currentItem,
  currentItemIndex,
  className = '',
  hasManagePermission = false
}) => {
  if (!currentItem) {
    return (
      <div className={className}>
        <div className="participant-no-item">
          <h2>No agenda item is currently active</h2>
          <p>Please wait for the meeting to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="participant-current-badge">
        CURRENT ITEM
      </div>
      <h2 className="participant-item-title">
        {currentItem.title}
      </h2>
      <div className="participant-item-type">
        {currentItem.type}
      </div>
      {currentItem.description && (
        <p className="participant-item-description">
          {currentItem.description}
        </p>
      )}

      {/* Show Motion Manager when current item is a motion type */}
      {currentItem.type === 'motion' && currentItem.motion_item_id && (
        <div style={{ marginTop: '20px' }}>
          <MotionManager
            meetingId={meetingId}
            motionItemId={currentItem.motion_item_id}
            hasManagePermission={hasManagePermission}
          />
        </div>
      )}

      {/* Show positions for election type */}
      {currentItem.type === 'election' && currentItem.positions && currentItem.positions.length > 0 && (
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <ElectionManager
            meetingId={meetingId}
            agendaItemIndex={currentItemIndex}
            positions={currentItem.positions}
            hasManagePermission={hasManagePermission}
          />
        </div>
      )}
    </div>
  );
};

export default CurrentAgendaItem;
