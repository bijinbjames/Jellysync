import { describe, it, expect } from 'vitest';
import {
  isSignalMessage,
  isValidSignalMessageType,
  isClientSignalMessageType,
  isValidSignalOfferPayload,
  isValidSignalAnswerPayload,
  isValidSignalIceCandidatePayload,
  createWsMessage,
  type WsMessage,
} from './messages.js';
import { SIGNAL_MESSAGE_TYPE } from './constants.js';

describe('SIGNAL_MESSAGE_TYPE', () => {
  it('has OFFER constant', () => {
    expect(SIGNAL_MESSAGE_TYPE.OFFER).toBe('signal:offer');
  });

  it('has ANSWER constant', () => {
    expect(SIGNAL_MESSAGE_TYPE.ANSWER).toBe('signal:answer');
  });

  it('has ICE_CANDIDATE constant', () => {
    expect(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE).toBe('signal:ice-candidate');
  });
});

describe('isSignalMessage', () => {
  it('returns true for signal: prefixed messages', () => {
    const msg: WsMessage = { type: 'signal:offer', payload: {}, timestamp: 1234 };
    expect(isSignalMessage(msg)).toBe(true);
  });

  it('returns true for signal:answer', () => {
    const msg: WsMessage = { type: 'signal:answer', payload: {}, timestamp: 1234 };
    expect(isSignalMessage(msg)).toBe(true);
  });

  it('returns true for signal:ice-candidate', () => {
    const msg: WsMessage = { type: 'signal:ice-candidate', payload: {}, timestamp: 1234 };
    expect(isSignalMessage(msg)).toBe(true);
  });

  it('returns false for non-signal messages', () => {
    const msg: WsMessage = { type: 'room:create', payload: {}, timestamp: 1234 };
    expect(isSignalMessage(msg)).toBe(false);
  });

  it('returns false for sync messages', () => {
    const msg: WsMessage = { type: 'sync:play', payload: {}, timestamp: 1234 };
    expect(isSignalMessage(msg)).toBe(false);
  });
});

describe('isValidSignalMessageType', () => {
  it('returns true for signal:offer', () => {
    expect(isValidSignalMessageType('signal:offer')).toBe(true);
  });

  it('returns true for signal:answer', () => {
    expect(isValidSignalMessageType('signal:answer')).toBe(true);
  });

  it('returns true for signal:ice-candidate', () => {
    expect(isValidSignalMessageType('signal:ice-candidate')).toBe(true);
  });

  it('returns false for invalid types', () => {
    expect(isValidSignalMessageType('signal:invalid')).toBe(false);
    expect(isValidSignalMessageType('room:create')).toBe(false);
    expect(isValidSignalMessageType('')).toBe(false);
  });
});

describe('isClientSignalMessageType', () => {
  it('returns true for all signal message types', () => {
    expect(isClientSignalMessageType('signal:offer')).toBe(true);
    expect(isClientSignalMessageType('signal:answer')).toBe(true);
    expect(isClientSignalMessageType('signal:ice-candidate')).toBe(true);
  });

  it('returns false for invalid types', () => {
    expect(isClientSignalMessageType('signal:invalid')).toBe(false);
    expect(isClientSignalMessageType('')).toBe(false);
  });
});

describe('isValidSignalOfferPayload', () => {
  it('returns true for valid payload', () => {
    const payload = {
      targetParticipantId: 'user-2',
      offer: { type: 'offer', sdp: 'v=0\r\n...' },
    };
    expect(isValidSignalOfferPayload(payload)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidSignalOfferPayload(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidSignalOfferPayload('string')).toBe(false);
  });

  it('returns false for missing targetParticipantId', () => {
    const payload = { offer: { type: 'offer', sdp: 'v=0\r\n...' } };
    expect(isValidSignalOfferPayload(payload)).toBe(false);
  });

  it('returns false for non-string targetParticipantId', () => {
    const payload = { targetParticipantId: 123, offer: { type: 'offer', sdp: 'v=0\r\n...' } };
    expect(isValidSignalOfferPayload(payload)).toBe(false);
  });

  it('returns false for missing offer', () => {
    const payload = { targetParticipantId: 'user-2' };
    expect(isValidSignalOfferPayload(payload)).toBe(false);
  });

  it('returns false for null offer', () => {
    const payload = { targetParticipantId: 'user-2', offer: null };
    expect(isValidSignalOfferPayload(payload)).toBe(false);
  });

  it('returns false for wrong offer type', () => {
    const payload = {
      targetParticipantId: 'user-2',
      offer: { type: 'answer', sdp: 'v=0\r\n...' },
    };
    expect(isValidSignalOfferPayload(payload)).toBe(false);
  });

  it('returns false for missing sdp', () => {
    const payload = {
      targetParticipantId: 'user-2',
      offer: { type: 'offer' },
    };
    expect(isValidSignalOfferPayload(payload)).toBe(false);
  });

  it('returns false for non-string sdp', () => {
    const payload = {
      targetParticipantId: 'user-2',
      offer: { type: 'offer', sdp: 123 },
    };
    expect(isValidSignalOfferPayload(payload)).toBe(false);
  });
});

describe('isValidSignalAnswerPayload', () => {
  it('returns true for valid payload', () => {
    const payload = {
      targetParticipantId: 'user-1',
      answer: { type: 'answer', sdp: 'v=0\r\n...' },
    };
    expect(isValidSignalAnswerPayload(payload)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidSignalAnswerPayload(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidSignalAnswerPayload(42)).toBe(false);
  });

  it('returns false for missing targetParticipantId', () => {
    const payload = { answer: { type: 'answer', sdp: 'v=0\r\n...' } };
    expect(isValidSignalAnswerPayload(payload)).toBe(false);
  });

  it('returns false for missing answer', () => {
    const payload = { targetParticipantId: 'user-1' };
    expect(isValidSignalAnswerPayload(payload)).toBe(false);
  });

  it('returns false for null answer', () => {
    const payload = { targetParticipantId: 'user-1', answer: null };
    expect(isValidSignalAnswerPayload(payload)).toBe(false);
  });

  it('returns false for wrong answer type', () => {
    const payload = {
      targetParticipantId: 'user-1',
      answer: { type: 'offer', sdp: 'v=0\r\n...' },
    };
    expect(isValidSignalAnswerPayload(payload)).toBe(false);
  });

  it('returns false for non-string sdp', () => {
    const payload = {
      targetParticipantId: 'user-1',
      answer: { type: 'answer', sdp: 123 },
    };
    expect(isValidSignalAnswerPayload(payload)).toBe(false);
  });
});

describe('isValidSignalIceCandidatePayload', () => {
  it('returns true for valid payload with all fields', () => {
    const payload = {
      targetParticipantId: 'user-2',
      candidate: { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 },
    };
    expect(isValidSignalIceCandidatePayload(payload)).toBe(true);
  });

  it('returns true for valid payload with null sdpMid and sdpMLineIndex', () => {
    const payload = {
      targetParticipantId: 'user-2',
      candidate: { candidate: 'candidate:1 ...', sdpMid: null, sdpMLineIndex: null },
    };
    expect(isValidSignalIceCandidatePayload(payload)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidSignalIceCandidatePayload(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidSignalIceCandidatePayload('string')).toBe(false);
  });

  it('returns false for missing targetParticipantId', () => {
    const payload = {
      candidate: { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 },
    };
    expect(isValidSignalIceCandidatePayload(payload)).toBe(false);
  });

  it('returns false for missing candidate', () => {
    const payload = { targetParticipantId: 'user-2' };
    expect(isValidSignalIceCandidatePayload(payload)).toBe(false);
  });

  it('returns false for null candidate', () => {
    const payload = { targetParticipantId: 'user-2', candidate: null };
    expect(isValidSignalIceCandidatePayload(payload)).toBe(false);
  });

  it('returns false for non-string candidate.candidate', () => {
    const payload = {
      targetParticipantId: 'user-2',
      candidate: { candidate: 123, sdpMid: '0', sdpMLineIndex: 0 },
    };
    expect(isValidSignalIceCandidatePayload(payload)).toBe(false);
  });

  it('returns false for invalid sdpMid type', () => {
    const payload = {
      targetParticipantId: 'user-2',
      candidate: { candidate: 'candidate:1 ...', sdpMid: 123, sdpMLineIndex: 0 },
    };
    expect(isValidSignalIceCandidatePayload(payload)).toBe(false);
  });

  it('returns false for invalid sdpMLineIndex type', () => {
    const payload = {
      targetParticipantId: 'user-2',
      candidate: { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 'invalid' },
    };
    expect(isValidSignalIceCandidatePayload(payload)).toBe(false);
  });
});

describe('createWsMessage for signal messages', () => {
  it('creates a signal:offer message', () => {
    const msg = createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
      targetParticipantId: 'user-2',
      offer: { type: 'offer' as const, sdp: 'v=0\r\n...' },
    });
    expect(msg.type).toBe('signal:offer');
    expect(msg.payload.targetParticipantId).toBe('user-2');
    expect(msg.payload.offer.type).toBe('offer');
    expect(typeof msg.timestamp).toBe('number');
  });

  it('creates a signal:answer message', () => {
    const msg = createWsMessage(SIGNAL_MESSAGE_TYPE.ANSWER, {
      targetParticipantId: 'user-1',
      answer: { type: 'answer' as const, sdp: 'v=0\r\n...' },
    });
    expect(msg.type).toBe('signal:answer');
    expect(msg.payload.targetParticipantId).toBe('user-1');
    expect(msg.payload.answer.type).toBe('answer');
    expect(typeof msg.timestamp).toBe('number');
  });

  it('creates a signal:ice-candidate message', () => {
    const msg = createWsMessage(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, {
      targetParticipantId: 'user-2',
      candidate: { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 },
    });
    expect(msg.type).toBe('signal:ice-candidate');
    expect(msg.payload.targetParticipantId).toBe('user-2');
    expect(msg.payload.candidate.candidate).toBe('candidate:1 ...');
    expect(typeof msg.timestamp).toBe('number');
  });
});
