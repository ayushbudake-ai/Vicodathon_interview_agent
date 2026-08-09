import { LayoutGrid, Server, Code, Layers, Cpu, Sparkles, Database, Cloud, Shield, Smartphone, HardDrive, Network } from "lucide-react";

export const defaultDomains = [
  { id: "Backend Development", title: "Backend Development", icon: Server, description: "APIs, databases, caching, concurrency, and backend architecture." },
  { id: "Frontend Development", title: "Frontend Development", icon: Code, description: "UI architecture, rendering performance, state management, and web APIs." },
  { id: "Full Stack Development", title: "Full Stack Development", icon: Layers, description: "End-to-end web applications, API integrations, and frontend/backend trade-offs." },
  { id: "AI / Machine Learning", title: "AI / Machine Learning", icon: Cpu, description: "ML algorithms, neural networks, model training, evaluation, and feature engineering." },
  { id: "Generative AI", title: "Generative AI", icon: Sparkles, description: "LLMs, RAG, prompt engineering, embeddings, vector search, and AI agents." },
  { id: "Data Science", title: "Data Science", icon: LayoutGrid, description: "Data analysis, statistical modeling, pandas, experimental design, and metrics." },
  { id: "Data Engineering", title: "Data Engineering", icon: HardDrive, description: "Data pipelines, ETL, distributed systems, data warehousing, and streaming." },
  { id: "DevOps / Cloud", title: "DevOps / Cloud", icon: Cloud, description: "CI/CD, Kubernetes, Docker, cloud infrastructure, terraform, and observability." },
  { id: "System Design", title: "System Design", icon: Network, description: "Distributed systems, scalability, load balancing, fault tolerance, and data storage." },
  { id: "Cybersecurity", title: "Cybersecurity", icon: Shield, description: "Application security, authentication, encryption, threat modeling, and vulnerabilities." },
  { id: "Mobile Development", title: "Mobile Development", icon: Smartphone, description: "iOS/Android engineering, offline sync, performance, and mobile app lifecycle." },
  { id: "Database Engineering", title: "Database Engineering", icon: Database, description: "SQL tuning, indexing strategies, query execution plans, sharding, and ACID transactions." }
];

export default function DomainSelector({ selectedDomain, onSelectDomain, customDomains = [] }) {
  const allDomains = [
    ...defaultDomains,
    ...customDomains.filter((cd) => !defaultDomains.some((d) => d.id.toLowerCase() === cd.id.toLowerCase()))
  ];

  return (
    <div className="selector-container">
      <div className="selector-heading">
        <span className="small-label">STEP 1 · TECHNICAL DOMAIN</span>
        <h2>Select Technical Domain</h2>
        <p>Choose the engineering domain for your adaptive interview assessment.</p>
      </div>

      <div className="domain-grid">
        {allDomains.map((domain) => {
          const Icon = domain.icon || Server;
          const isSelected = (selectedDomain || "").toLowerCase() === domain.id.toLowerCase();
          return (
            <button
              key={domain.id}
              type="button"
              data-testid={`domain-${domain.id}`}
              className={`domain-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectDomain(domain.id)}
            >
              <div className="domain-card-header">
                <div className="domain-icon-wrapper">
                  <Icon size={18} />
                </div>
                <strong>{domain.title}</strong>
              </div>
              <p>{domain.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
