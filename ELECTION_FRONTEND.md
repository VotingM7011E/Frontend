# Election Agenda Frontend Implementation

## Overview
The frontend now supports creating and managing election agenda items during meetings. When a meeting owner navigates to an election agenda item, the ElectionManager component appears allowing them to:

1. Accept nominations
2. Manage candidates
3. Close nominations and start voting

## Components Created

### 1. ElectionManager Component (`frontend/src/components/ElectionManager.tsx`)
- **Purpose**: Manages the election lifecycle for a specific agenda item
- **Features**:
  - Automatically creates positions in ElectionService when rendered
  - Displays all positions for the election
  - Allows nominating candidates
  - Shows pending/accepted nominations
  - Enables accepting nominations
  - Closes nominations and creates polls when ready (requires 2+ accepted candidates)
  - Shows poll ID when voting is active

### 2. ElectionManager CSS (`frontend/src/components/ElectionManager.css`)
- Styled cards for each position
- Color-coded status indicators (Open 🟢, Voting 🗳️, Closed ⏸️)
- Responsive nomination form
- Clear visual hierarchy

## Updated Components

### MeetingRoom.tsx
- Added election position management to agenda creation form
- Integrated ElectionManager component
- Shows ElectionManager when current agenda item is an election
- Added state management for election positions

## User Flow

### Creating an Election Agenda Item
1. Meeting owner clicks "Add Agenda Item"
2. Selects "Election" type
3. Enters title (e.g., "Board Elections 2026")
4. Adds positions (e.g., "President", "Vice President", "Secretary")
5. Submits the agenda item

### During Meeting - Election Phase
1. Owner navigates to the election agenda item
2. ElectionManager automatically appears below the agenda item
3. Positions are automatically created in ElectionService
4. Members can now nominate candidates by entering usernames
5. Candidates or owner can accept nominations
6. Owner sees count of accepted candidates for each position

### Starting Voting
1. Owner ensures at least 2 candidates are accepted per position
2. Clicks "Close Nominations & Start Voting" button
3. System creates poll in VotingService
4. Poll ID is displayed
5. Status changes to "Voting 🗳️"

## API Integration

The ElectionManager communicates with ElectionService:

```typescript
ELECTION_SERVICE_URL = 'http://localhost:5002' (dev) or '/api/election-service' (prod)
```

### Endpoints Used:
- `POST /positions` - Create election positions
- `GET /positions?meeting_id={id}` - Get existing positions
- `POST /positions/{id}/nominations` - Add nomination
- `GET /positions/{id}/nominations` - Get all nominations
- `POST /positions/{id}/nominations/{username}/accept` - Accept nomination
- `POST /positions/{id}/close` - Close nominations and start voting

## Features

### Automatic Position Creation
- When ElectionManager loads, it checks if positions exist for the meeting
- If not, creates them automatically based on the positions array
- Prevents duplicate position creation

### Real-time Status
- Shows current status for each position (Open, Voting, Closed)
- Displays count of nominations and accepted candidates
- Enables/disables buttons based on state

### Validation
- Requires at least 2 accepted candidates before closing nominations
- Button is disabled until requirement is met
- Clear error messages for failed operations

### Visual Feedback
- Color-coded status badges
- Green checkmarks for accepted nominations
- Disabled state for buttons that can't be used
- Error messages in red boxes

## Example Usage

```typescript
// In MeetingRoom, election agenda item looks like:
{
  type: 'election',
  title: 'Board Elections 2026',
  positions: ['President', 'Vice President', 'Secretary']
}

// When current_item points to this item, ElectionManager renders:
<ElectionManager
  meetingId={meeting.meeting_id}
  meetingCode={meeting.meeting_code}
  positions={item.positions}
/>
```

## Next Steps (Future Enhancements)

1. **Real-time Updates**: Use WebSocket to update nominations in real-time
2. **Voting Integration**: Direct link to VotingService UI with poll_id
3. **Results Display**: Show election results after voting completes
4. **Nomination Removal**: Allow removing nominations before they're accepted
5. **Self-nomination**: Detect current user and allow self-nomination
6. **Candidate Profiles**: Show additional info about nominees
7. **Multiple Elections**: Handle multiple election agenda items in one meeting
8. **Export Results**: Download election results as PDF/CSV

## Environment Configuration

Development:
```
ElectionService: http://localhost:5002
```

Production:
```
ElectionService: /api/election-service (proxied)
```

## Styling Notes

The ElectionManager uses a card-based layout with:
- White background for position cards
- Light gray for nomination items
- Blue for primary actions
- Orange for critical actions (close nominations)
- Green for success states (voting active)
- Red for errors

All colors follow Material Design principles and match the existing Meeting.css theme.
