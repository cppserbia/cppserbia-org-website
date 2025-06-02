import type { Event } from '@/lib/events-server';

/**
 * Generates SEO-optimized keywords for an event based on its content
 */
export function generateEventKeywords(event: Event): string {
  const baseKeywords = [
    'C++',
    'programming',
    'Serbia',
    'Belgrade',
    'meetup',
    'technology',
    'software development',
    'community'
  ];

  const eventSpecificKeywords: string[] = [];

  // Extract keywords from title
  const titleWords = event.title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['the', 'and', 'for', 'with', 'from', 'this', 'that'].includes(word));
  
  eventSpecificKeywords.push(...titleWords);

  // Add location-based keywords
  if (event.location.toLowerCase().includes('online')) {
    eventSpecificKeywords.push('online event', 'virtual meetup', 'remote learning');
  } else {
    eventSpecificKeywords.push('physical event', 'in-person meetup');
  }

  // Add keywords based on content
  if (event.content) {
    const content = event.content.toLowerCase();
    
    // Technical keywords
    const technicalTerms = [
      'template', 'metaprogramming', 'coroutines', 'ranges', 'concepts',
      'performance', 'optimization', 'memory', 'algorithm', 'data structures',
      'concurrent', 'parallel', 'async', 'modern cpp', 'cpp20', 'cpp23',
      'cmake', 'vcpkg', 'debugging', 'testing', 'best practices'
    ];

    technicalTerms.forEach(term => {
      if (content.includes(term)) {
        eventSpecificKeywords.push(term);
      }
    });
  }

  // Combine and deduplicate
  const allKeywords = [...baseKeywords, ...eventSpecificKeywords];
  const uniqueKeywords = Array.from(new Set(allKeywords));

  return uniqueKeywords.join(', ');
}

/**
 * Generates a better description for an event if the original is too short
 */
export function generateEventDescription(event: Event): string {
  if (event.description && event.description.length > 100) {
    return event.description;
  }

  const eventType = event.isOnline ? 'online' : 'in-person';
  const baseDescription = `Join C++ Serbia community for "${event.title}" - an ${eventType} event`;
  
  let enhancedDescription = baseDescription;
  
  if (event.location !== 'TBD') {
    enhancedDescription += ` taking place ${event.isOnline ? 'online' : `at ${event.location}`}`;
  }
  
  enhancedDescription += `. Connect with fellow C++ developers, learn about modern C++ techniques, and expand your programming knowledge.`;
  
  if (event.registrationLink) {
    enhancedDescription += ` Register now to secure your spot!`;
  }

  return enhancedDescription;
}
