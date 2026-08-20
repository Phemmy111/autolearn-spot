/**
 * Web Research Intent Detection Tests
 * 
 * Tests for enhanced research intent detection logic
 */

import { WebResearchService } from '../web-research/web-research-service';

describe('WebResearchService - Intent Detection', () => {
  let webResearchService: WebResearchService;

  beforeAll(() => {
    webResearchService = new WebResearchService();
  });

  describe('Entity-based factual questions', () => {
    test('Who is the founder of AutoLearn Spot? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Who is the founder of AutoLearn Spot?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.7);
      expect(intent.reason).toContain('Entity-based');
    });

    test('Who founded OpenAI? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Who founded OpenAI?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.7);
    });

    test('Who is the current CEO of Microsoft? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Who is the current CEO of Microsoft?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.7);
    });

    test('When was AutoLearn Spot founded? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('When was AutoLearn Spot founded?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Current/timely information questions', () => {
    test('What is the latest n8n version? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('What is the latest n8n version?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.8);
      expect(intent.reason).toContain('current/timely');
    });

    test('What are the current prices of X? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('What are the current prices of X?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.8);
    });

    test('Is this company still operating? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Is this company still operating?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Comparison questions', () => {
    test('Compare AutoLearn Spot with Coursera. → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Compare AutoLearn Spot with Coursera.');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.7);
    });

    test('What are people saying about X? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('What are people saying about X?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.7);
    });

    test('What are the latest developments in AI agents? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('What are the latest developments in AI agents?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Conceptual/educational questions', () => {
    test('Explain n8n webhooks. → research = false', () => {
      const intent = webResearchService.detectResearchIntent('Explain n8n webhooks.');
      expect(intent.requiresResearch).toBe(false);
      expect(intent.reason).toContain('Conceptual');
    });

    test('What is JavaScript? → research = false', () => {
      const intent = webResearchService.detectResearchIntent('What is JavaScript?');
      expect(intent.requiresResearch).toBe(false);
      expect(intent.reason).toContain('Conceptual');
    });

    test('Help me write a JavaScript function. → research = false', () => {
      const intent = webResearchService.detectResearchIntent('Help me write a JavaScript function.');
      expect(intent.requiresResearch).toBe(false);
      expect(intent.reason).toContain('Conceptual');
    });

    test('How do JavaScript arrays work? → research = false', () => {
      const intent = webResearchService.detectResearchIntent('How do JavaScript arrays work?');
      expect(intent.requiresResearch).toBe(false);
      expect(intent.reason).toContain('Conceptual');
    });
  });

  describe('Platform context priority', () => {
    test('What is my course progress? → research = false (with platform context)', () => {
      const intent = webResearchService.detectResearchIntent('What is my course progress?', true, false);
      expect(intent.requiresResearch).toBe(false);
      expect(intent.reason).toContain('Platform context');
    });

    test('What lessons have I completed? → research = false (with platform context)', () => {
      const intent = webResearchService.detectResearchIntent('What lessons have I completed?', true, false);
      expect(intent.requiresResearch).toBe(false);
      expect(intent.reason).toContain('Platform context');
    });

    test('Who is the founder of AutoLearn Spot? → research = true (even with platform context)', () => {
      const intent = webResearchService.detectResearchIntent('Who is the founder of AutoLearn Spot?', true, false);
      expect(intent.requiresResearch).toBe(true);
      expect(intent.reason).toContain('Entity-based');
    });
  });

  describe('File context priority', () => {
    test('Summarize this uploaded PDF. → research = false (with file context)', () => {
      const intent = webResearchService.detectResearchIntent('Summarize this uploaded PDF.', false, true);
      expect(intent.requiresResearch).toBe(false);
      expect(intent.reason).toContain('File context');
    });

    test('Compare this PDF with current information online. → research = true (with file context)', () => {
      const intent = webResearchService.detectResearchIntent('Compare this PDF with current information online.', false, true);
      expect(intent.requiresResearch).toBe(true);
      expect(intent.reason).toContain('compare with current');
    });

    test('Who is mentioned in this document? → research = false (with file context)', () => {
      const intent = webResearchService.detectResearchIntent('Who is mentioned in this document?', false, true);
      expect(intent.requiresResearch).toBe(false);
      expect(intent.reason).toContain('File context');
    });
  });

  describe('Explicit research requests', () => {
    test('Search the web for the founder of AutoLearn Spot. → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Search the web for the founder of AutoLearn Spot.');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.9);
      expect(intent.reason).toContain('Explicit');
    });

    test('Find sources about Nigerian data protection law. → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Find sources about Nigerian data protection law.');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.9);
    });

    test('Is this information still accurate? → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Is this information still accurate?');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.7);
    });

    test('Verify this claim. → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Verify this claim.');
      expect(intent.requiresResearch).toBe(true);
      expect(intent.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Edge cases', () => {
    test('Empty query → research = false', () => {
      const intent = webResearchService.detectResearchIntent('');
      expect(intent.requiresResearch).toBe(false);
    });

    test('Mixed conceptual and factual → research should be determined by primary intent', () => {
      const intent = webResearchService.detectResearchIntent('Explain who founded OpenAI and what they did');
      // This is borderline - it's asking for both explanation and factual info
      // The entity pattern should take precedence
      expect(intent.requiresResearch).toBe(true);
    });

    test('What is the latest version of JavaScript? → research = true (timely + conceptual)', () => {
      const intent = webResearchService.detectResearchIntent('What is the latest version of JavaScript?');
      // "latest" should trigger research even though it's about a concept
      expect(intent.requiresResearch).toBe(true);
      expect(intent.reason).toContain('current/timely');
    });
  });

  describe('Context influence', () => {
    test('Who is the founder without context → research = true', () => {
      const intent = webResearchService.detectResearchIntent('Who is the founder of X?', false, false);
      expect(intent.requiresResearch).toBe(true);
    });

    test('What is my progress without context → research = false (no platform context)', () => {
      const intent = webResearchService.detectResearchIntent('What is my progress?', false, false);
      // Without platform context, this might trigger research
      // But the pattern matching should still recognize it as potentially platform-specific
      expect(intent.requiresResearch).toBe(false);
    });
  });
});
