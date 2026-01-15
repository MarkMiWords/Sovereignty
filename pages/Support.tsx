
import React, { useState } from 'react';

type Region = 'AU' | 'US' | 'UK' | 'GLOBAL';

interface Resource {
  name: string;
  description: string;
  url: string;
  category: 'Mental Health' | 'Legal' | 'Reintegration' | 'Human Rights';
}

const RESOURCES: Record<Region, Resource[]> = {
  AU: [
    { name: "Lifeline Australia", description: "24/7 crisis support and suicide prevention services.", url: "https://www.lifeline.org.au", category: "Mental Health" },
    { name: "Beyond Blue", description: "Support for anxiety, depression, and suicide prevention.", url: "https://www.beyondblue.org.au", category: "Mental Health" },
    { name: "Justice Action", description: "Australian community base for criminal justice reform and prisoner support.", url: "https://www.justiceaction.org.au", category: "Human Rights" },
    { name: "Prisoners' Aid NSW", description: "Assisting prisoners and their families in New South Wales.", url: "https://www.pan.org.au", category: "Reintegration" },
    { name: "First Peoples Disability Network", description: "Support for Aboriginal and Torres Strait Islander people with disability.", url: "https://fpdn.org.au", category: "Human Rights" }
  ],
  US: [
    { name: "Crisis Text Line", description: "Free 24/7 support at your fingertips. Text HOME to 741741.", url: "https://www.crisistextline.org", category: "Mental Health" },
    { name: "ACLU", description: "The American Civil Liberties Union provides legal support for civil rights.", url: "https://www.aclu.org", category: "Legal" },
    { name: "The Sentencing Project", description: "Working for a fair and effective U.S. criminal justice system.", url: "https://www.sentencingproject.org", category: "Human Rights" },
    { name: "Fortune Society", description: "Support for successful reentry from incarceration.", url: "https://fortunesociety.org", category: "Reintegration" },
    { name: "Prison Policy Initiative", description: "Research and advocacy on mass incarceration.", url: "https://www.prisonpolicy.org", category: "Legal" }
  ],
  UK: [
    { name: "Samaritans UK", description: "Whatever you're going through, a Samaritan will face it with you.", url: "https://www.samaritans.org", category: "Mental Health" },
    { name: "Prison Reform Trust", description: "Independent charity working to create a just, humane and effective penal system.", url: "https://www.prisonreformtrust.org.uk", category: "Human Rights" },
    { name: "Unlock", description: "Support and advice for people with criminal records.", url: "https://unlock.org.uk", category: "Reintegration" },
    { name: "Howard League for Penal Reform", description: "The oldest penal reform charity in the world.", url: "https://howardleague.org", category: "Legal" }
  ],
  GLOBAL: [
    { name: "Amnesty International", description: "Global movement of people fighting for human rights.", url: "https://www.amnesty.org", category: "Human Rights" },
    { name: "International Red Cross", description: "Humanitarian protection and assistance for victims of war and violence.", url: "https://www.icrc.org", category: "Human Rights" },
    { name: "World Federation for Mental Health", description: "Global mental health advocacy and awareness.", url: "https://wfmh.global", category: "Mental Health" },
    { name: "Human Rights Watch", description: "Investigates and reports on abuses happening in all corners of the world.", url: "https://www.hrw.org", category: "Human Rights" }
  ]
};

const Support: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<Region>('AU');

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center border-b border-white/5">
        <span className="text-accent tracking-[0.6em] uppercase text-[10px] font-bold mb-6 block animate-fade-in">Kindred Spirits</span>
        <h1 className="text-6xl md:text-8xl font-serif font-bold mb-8 italic leading-none">Support <span className="text-accent">Hub.</span></h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed italic opacity-80">
          "The journey through the system leaves marks that ink alone cannot heal. Find your community and your resources here."
        </p>
      </section>

      {/* Region Selector */}
      <section className="max-w-4xl mx-auto px-6 py-12 flex flex-wrap justify-center gap-4">
        {(['AU', 'US', 'UK', 'GLOBAL'] as Region[]).map((region) => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`px-10 py-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all border ${
              selectedRegion === region 
              ? 'bg-accent border-accent text-white shadow-[0_0_30px_rgba(230,126,34,0.3)]' 
              : 'border-white/10 text-gray-500 hover:border-white/30'
            }`}
          >
            {region === 'AU' ? 'Australia' : region === 'US' ? 'United States' : region === 'UK' ? 'United Kingdom' : 'International'}
          </button>
        ))}
      </section>

      {/* Resource Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {RESOURCES[selectedRegion].map((resource, index) => (
          <div 
            key={index} 
            className="group bg-[#0d0d0d] border border-white/5 p-10 hover:border-accent/30 transition-all animate-fade-in flex flex-col"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-[9px] font-bold text-accent uppercase tracking-widest border border-accent/20 px-3 py-1">
                {resource.category}
              </span>
              <div className="w-2 h-2 rounded-full bg-accent/20"></div>
            </div>
            <h3 className="text-2xl font-serif font-bold mb-4 group-hover:text-accent transition-colors">{resource.name}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-10 italic flex-grow">"{resource.description}"</p>
            <a 
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-white border-b border-white hover:text-accent hover:border-accent pb-1 transition-all w-fit"
            >
              Access Resource
            </a>
          </div>
        ))}
      </section>

      {/* Emergency Footer */}
      <section className="max-w-3xl mx-auto px-6 mt-20 p-12 bg-white/5 border border-white/10 text-center">
         <h4 className="text-white font-serif italic text-2xl mb-4">In Immediate Crisis?</h4>
         <p className="text-gray-400 text-sm font-light mb-8">If you are in danger or experiencing a life-threatening emergency, please contact your local emergency services immediately.</p>
         <div className="flex justify-center gap-12 text-[10px] font-bold uppercase tracking-widest text-accent">
            <span>AU: 000</span>
            <span>US: 911</span>
            <span>UK: 999</span>
         </div>
      </section>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Support;
