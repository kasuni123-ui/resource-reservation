'use strict';
const { Package } = require('./models');

const data = [
  { title: 'Cultural Triangle and Kandy', slug: 'cultural-triangle-kandy', destination: 'Sigiriya, Kandy', category: 'Culture', days: 8, price: 1150, rating: 4.8, icon: '🏯', hue: 28,
    summary: 'Ancient rock fortresses, cave temples and the sacred city of Kandy with a private driver-guide.',
    itinerary: ['Day 1: Airport pickup and transfer to Negombo', 'Day 2: Anuradhapura ruins by bicycle', 'Day 3: Sigiriya Rock at sunrise and Dambulla cave temple', 'Day 4: Village cooking class and drive to Kandy', 'Day 5: Temple of the Tooth and botanical gardens', 'Day 8: Transfer to the airport'],
    includes: ['Private vehicle and driver-guide', 'Breakfast daily', 'Entrance fees', 'Hotel stays'] },
  { title: 'Tea Country and the Ella Train', slug: 'tea-country-ella-train', destination: 'Nuwara Eliya, Ella', category: 'Culture', days: 6, price: 890, rating: 4.7, icon: '🚂', hue: 150,
    summary: 'Tea estates, waterfalls and the famous Kandy to Ella train ride through the hills.',
    itinerary: ['Day 1: Arrive in Kandy', 'Day 2: Scenic train to Nuwara Eliya and tea factory visit', 'Day 3: Horton Plains and World\'s End walk', 'Day 4: Train to Ella and Nine Arches Bridge', 'Day 5: Little Adam\'s Peak sunrise hike', 'Day 6: Departure transfer'],
    includes: ['Reserved train seats', 'Private transfers', 'Breakfast daily', 'Hotel stays'] },
  { title: 'South Coast Beach Escape', slug: 'south-coast-beach-escape', destination: 'Galle, Mirissa', category: 'Beach', days: 7, price: 980, rating: 4.6, icon: '🏖️', hue: 190,
    summary: 'Galle Fort, golden beaches and a morning whale watching trip from Mirissa.',
    itinerary: ['Day 1: Arrive and transfer to the coast', 'Day 2: Galle Fort walking tour', 'Day 3: Free day on the beach', 'Day 4: Whale watching from Mirissa', 'Day 5: Stilt fishermen and turtle hatchery', 'Day 7: Departure transfer'],
    includes: ['Private transfers', 'Breakfast daily', 'Whale watching boat ticket', 'Beach hotel stays'] },
  { title: 'Yala and Udawalawe Safari', slug: 'yala-udawalawe-safari', destination: 'Yala, Udawalawe', category: 'Wildlife', days: 5, price: 760, rating: 4.9, icon: '🐘', hue: 95,
    summary: 'Two national parks, leopards, elephants and an expert tracker on every jeep safari.',
    itinerary: ['Day 1: Drive to Udawalawe', 'Day 2: Morning elephant safari and transit home visit', 'Day 3: Transfer to Yala', 'Day 4: Dawn leopard safari in Yala', 'Day 5: Departure transfer'],
    includes: ['Jeep safaris with tracker', 'Park fees', 'Breakfast daily', 'Lodge stays'] },
  { title: 'Maldives Overwater Retreat', slug: 'maldives-overwater-retreat', destination: 'Maldives', category: 'Luxury', days: 6, price: 2650, rating: 4.9, icon: '🏝️', hue: 205,
    summary: 'Five nights in an overwater villa with seaplane transfer, snorkelling and a sunset cruise.',
    itinerary: ['Day 1: Seaplane to the resort', 'Day 2: House reef snorkelling', 'Day 3: Spa treatment and free time', 'Day 4: Sunset dolphin cruise', 'Day 6: Seaplane back to the airport'],
    includes: ['Seaplane transfers', 'Half board', 'Snorkelling gear', 'Sunset cruise'] },
  { title: 'Grand Tour with a Maldives Finish', slug: 'grand-tour-maldives-finish', destination: 'Sri Lanka, Maldives', category: 'Luxury', days: 14, price: 3400, rating: 4.8, icon: '🌴', hue: 170,
    summary: 'Culture, hill country and wildlife across Sri Lanka, then four nights of island rest in the Maldives.',
    itinerary: ['Days 1-3: Colombo and the Cultural Triangle', 'Days 4-5: Kandy and tea country', 'Days 6-7: Ella and Yala safari', 'Days 8-9: South coast and Galle Fort', 'Days 10-14: Fly to the Maldives and relax on a private island'],
    includes: ['Private vehicle and guide in Sri Lanka', 'Domestic and Maldives transfers', 'Breakfast daily', 'Resort half board'] }
];

module.exports = async function seed() {
  if (await Package.estimatedDocumentCount() === 0) {
    await Package.insertMany(data);
    console.log('Added sample packages.');
  }
};
