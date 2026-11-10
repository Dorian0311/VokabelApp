import { createEmptyCard } from 'ts-fsrs';
import type { Deck } from '../types';

export function createDemoDeck(): Deck {
  const now = Date.now();
  const words: Array<{ term: string; translation: string; phonetic: string; example: string }> = [
    { term: 'adventure', translation: 'Abenteuer', phonetic: '/ədˈventʃə/', example: 'Life is either a daring adventure or nothing.' },
    { term: 'journey', translation: 'Reise', phonetic: '/ˈdʒɜːni/', example: 'The journey of a thousand miles begins with a single step.' },
    { term: 'departure', translation: 'Abfahrt / Abreise', phonetic: '/dɪˈpɑːtʃə/', example: 'Please check the departure board for your flight.' },
    { term: 'destination', translation: 'Reiseziel', phonetic: '/ˌdestɪˈneɪʃn/', example: 'We finally arrived at our destination.' },
    { term: 'luggage', translation: 'Gepäck', phonetic: '/ˈlʌɡɪdʒ/', example: "Don't forget to collect your luggage at the carousel." },
    { term: 'accommodation', translation: 'Unterkunft', phonetic: '/əˌkɒməˈdeɪʃn/', example: 'We booked our accommodation well in advance.' },
    { term: 'itinerary', translation: 'Reiseplan', phonetic: '/aɪˈtɪnərəri/', example: 'Our itinerary includes three cities in two weeks.' },
    { term: 'abroad', translation: 'im Ausland', phonetic: '/əˈbrɔːd/', example: 'She has always dreamed of studying abroad.' },
    { term: 'currency', translation: 'Währung', phonetic: '/ˈkʌrənsi/', example: 'You can exchange currency at the airport.' },
    { term: 'customs', translation: 'Zoll', phonetic: '/ˈkʌstəmz/', example: 'We had to go through customs after landing.' },
    { term: 'passport', translation: 'Reisepass', phonetic: '/ˈpɑːspɔːt/', example: 'Make sure your passport is valid before you travel.' },
    { term: 'explore', translation: 'erkunden', phonetic: '/ɪkˈsplɔː/', example: 'We spent the day exploring the old town.' },
    { term: 'souvenir', translation: 'Andenken / Souvenir', phonetic: '/ˌsuːvəˈnɪə/', example: 'I bought a souvenir for my best friend.' },
    { term: 'scenery', translation: 'Landschaft', phonetic: '/ˈsiːnəri/', example: 'The scenery along the coast was breathtaking.' },
    { term: 'expedition', translation: 'Expedition', phonetic: '/ˌekspɪˈdɪʃn/', example: 'They planned an expedition to the mountain peak.' },
  ];

  return {
    id: 'demo-deck-travel',
    name: 'Englisch Unit 1 – Travel & Adventure',
    language: 'en',
    languageLabel: 'Englisch',
    flag: '🇬🇧',
    createdAt: now,
    cards: words.map((w, i) => ({
      id: `demo-card-${i}`,
      term: w.term,
      translation: w.translation,
      phonetic: w.phonetic,
      example: w.example,
      fsrs: createEmptyCard(),
      correctCount: 0,
      incorrectCount: 0,
      createdAt: now,
    })),
  };
}
