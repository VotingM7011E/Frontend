/**
 * Mock API Service for Development/Localhost
 * This simulates backend API responses for testing the frontend locally
 */

// Mock user database
const mockUsers: Record<
  string,
  { id: string; username: string; email: string; password: string }
> = {
  'user1@example.com': {
    id: '1',
    username: 'john_doe',
    email: 'user1@example.com',
    password: 'password123',
  },
  'user2@example.com': {
    id: '2',
    username: 'jane_smith',
    email: 'user2@example.com',
    password: 'password123',
  },
};

// Mock meetings database
const mockMeetings: Record<
  string,
  {
    id: string;
    code: string;
    title: string;
    description: string;
    hostId: string;
    isActive: boolean;
    participants: string[];
  }
> = {
  'meeting-1': {
    id: 'meeting-1',
    code: 'ABC123',
    title: 'Team Standup',
    description: 'Daily team synchronization meeting',
    hostId: '1',
    isActive: true,
    participants: ['1', '2'],
  },
  'meeting-2': {
    id: 'meeting-2',
    code: 'XYZ789',
    title: 'Project Review',
    description: 'Monthly project review and planning',
    hostId: '2',
    isActive: false,
    participants: ['2'],
  },
};

// Helper to generate tokens
const generateToken = (): string => {
  return 'mock_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Helper to generate meeting codes
const generateMeetingCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class MockApiService {
  /**
   * Authentication Endpoints
   */
  async login(email: string, password: string) {
    await delay(800); // Simulate network delay

    const user = mockUsers[email];
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken();

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async register(username: string, email: string, password: string) {
    await delay(800); // Simulate network delay

    if (mockUsers[email]) {
      throw new Error('Email already registered');
    }

    const newUser = {
      id: String(Object.keys(mockUsers).length + 1),
      username,
      email,
      password,
    };

    mockUsers[email] = newUser;
    const { password: _, ...userWithoutPassword } = newUser;
    const token = generateToken();

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async logout() {
    await delay(300);
    return { success: true };
  }

  /**
   * Meeting Endpoints
   */
  async createMeeting(title: string, description: string, hostId: string) {
    await delay(600);

    const meetingId = 'meeting-' + Date.now();
    const code = generateMeetingCode();

    const newMeeting = {
      id: meetingId,
      code,
      title,
      description,
      hostId,
      isActive: true,
      participants: [hostId],
    };

    mockMeetings[meetingId] = newMeeting;

    return {
      meetingId,
      code,
      title,
      description,
    };
  }

  async joinMeeting(meetingCode: string, participantId: string) {
    await delay(600);

    const meeting = Object.values(mockMeetings).find((m) => m.code === meetingCode.toUpperCase());

    if (!meeting) {
      throw new Error('Meeting not found. Invalid code.');
    }

    if (!meeting.participants.includes(participantId)) {
      meeting.participants.push(participantId);
    }

    return {
      meetingId: meeting.id,
      title: meeting.title,
      code: meeting.code,
    };
  }

  async getMeetingDetails(meetingId: string) {
    await delay(400);

    const meeting = mockMeetings[meetingId];

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      code: meeting.code,
      isActive: meeting.isActive,
      participants: meeting.participants.length,
    };
  }

  async leaveMeeting(meetingId: string, participantId: string) {
    await delay(400);

    const meeting = mockMeetings[meetingId];

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const index = meeting.participants.indexOf(participantId);
    if (index > -1) {
      meeting.participants.splice(index, 1);
    }

    return { success: true };
  }

  async getUserMeetings(userId: string) {
    await delay(500);

    const userMeetings = Object.values(mockMeetings).filter(
      (m) => m.hostId === userId || m.participants.includes(userId)
    );

    return userMeetings.map((m) => ({
      id: m.id,
      title: m.title,
      code: m.code,
      isActive: m.isActive,
      isHost: m.hostId === userId,
    }));
  }

  /**
   * Questions Endpoints
   */
  async getQuestions(_meetingId: string) {
    await delay(300);

    // Mock questions data
    return [
      {
        id: '1',
        text: 'What are the key deliverables?',
        votes: 5,
        userVoted: false,
      },
      {
        id: '2',
        text: 'What is the timeline?',
        votes: 3,
        userVoted: false,
      },
    ];
  }

  async submitQuestion(_meetingId: string, question: string) {
    await delay(400);

    return {
      id: String(Date.now()),
      text: question,
      votes: 0,
      userVoted: true,
    };
  }

  async voteOnQuestion(_meetingId: string, _questionId: string) {
    await delay(300);

    return { success: true };
  }
}

export default new MockApiService();
