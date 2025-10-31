import React, { useState, useEffect } from 'react';
import { festivals, Festival } from './Festivals'; // Import festivals data and type
import { useParams, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Sparkles,
  Users,
  Drum,
  Flame,
  Handshake
} from 'lucide-react';
import { motion } from 'framer-motion';
const FestivalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [festival, setFestival] = useState<Festival | undefined>();

  useEffect(() => {
    const foundFestival = festivals.find(f => f.id === id);
    setFestival(foundFestival);
  }, [id]);

  if (!festival) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-red-600 mb-4">Festival not found</h2>
        <button
          onClick={() => navigate('/festivals')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Back to Festivals
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/festivals')}
        className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
      >
        &larr; Back
      </button>
      {festival.id === '1' && (
      <section className="mb-8">
      {/* <div className="bg-white p-6 rounded-lg shadow-md"> */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Gifaata</h2>
        <p className="text-gray-700 mb-6">The New Year celebration of Wolaita people, Gifaata, is one of the most important intangible heritages of Ethiopia.
            For long centuries the people of Wolaita have preserved its indigenous culture, beliefs, tradition and other social identities
            that define them and make them different from other people in Ethiopia.
            Gifaata is a well-known festival among those rituals in Wolaita that has continued being celebrated annually in the month of September.</p>
            </div>
            </section> 
            )}
        {/* Embedded Video */}
        {festival.id === '1' && (
          <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Embedded Video</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <iframe
              width="100%"
              height="400"
              src="https://www.youtube.com/embed/s9_VqzP96tQ"
              title="Meskel Festival Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </section>
        )}

        {/* History (optional: for example, only for Gifaata) */}
        {festival.id === '1' && (
          <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">History</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600">
              Gifaataa is a cultural festival celebrated by the{' '}
              <a
                href="https://en.wikipedia.org/wiki/Welayta_people"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2E86C1' }}
              >
                Wolaita people
              </a>{' '}
              in the Southern Region of Ethiopia. This festival is celebrated each year in September.
              In this celebration, the Wolaita accept the New Year and send off the old one.
              Gifaataa means "the beginning" and is also considered the bridge from old to new, dark to light.
              During Gifaataa, the Wolaita dance and enjoy cultural foods.
              The significance of Gifaata is to eliminate issues of the past and start afresh, reconciling past quarrels
              and strengthening family and community ties moving forward.
            </p>
          </div>
        </section>
        )}

        {/* Schedule (optional section) */}
        {festival.id === '1' && (
          <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Schedule</h2>
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            {[
              {
                title: "Pre-Festival Rituals and Preparations",
                icon: <CalendarDays className="w-5 h-5 text-indigo-500" />,
                desc:
                  "Early September – Community cleaning, house decorations, traditional attire preparation, and musical setup.",
              },
              {
                title: "Gazze – Youth Performances",
                icon: <Users className="w-5 h-5 text-green-500" />,
                desc:
                  "15 days before Gifaata – Young boys and girls perform dances, songs, storytelling, and dramatizations reflecting Wolaita heritage.",
              },
              {
                title: "Lakea or Haya Haya Lakea",
                icon: <Drum className="w-5 h-5 text-yellow-500" />,
                desc:
                  "Mid-festival – Energetic men’s group dances with chants and traditional instruments, wearing cultural cloths.",
              },
              {
                title: "Gunliyaa Ceremony",
                icon: <Sparkles className="w-5 h-5 text-red-500" />,
                desc:
                  "Held just before the main day – Rituals led by elders for blessings, spiritual cleansing, and ancestral honoring.",
              },
              {
                title: "Main Gifaata Day",
                icon: <Flame className="w-5 h-5 text-orange-500" />,
                desc:
                  "Mid-to-late September – Mass gatherings, cultural performances, bonfires, traditional food sharing, and public speeches.",
              },
              {
                title: "Post-Festival Gatherings",
                icon: <Handshake className="w-5 h-5 text-blue-500" />,
                desc:
                  "After main day – Family reunions, sharing meals, and reflecting on blessings for the new year.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1">{item.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>


        )}
        {festival.id === '2' && (
          <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Schedule</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>
                <strong>Day 1:</strong> Family gatherings and traditional meals.
              </li>
              <li>
                <strong>Day 2:</strong> Cultural shows and public celebrations.
              </li>
              <li>
                <strong>Day 3:</strong> Community service and thanksgiving rituals.
              </li>
            </ul>
          </section>
          )}
      </div>
    // </div>
  );
};

export default FestivalDetail;
