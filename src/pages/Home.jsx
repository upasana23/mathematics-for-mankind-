import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { youtubeVideos, books } from '../data/mockData';

const MATH_EQUATIONS = [
  'e^(i*π) + 1 = 0',
  '∫ e^x dx = e^x',
  '∇ × E = -∂B/∂t',
  'E = mc²',
  'iℏ ∂/∂t|Ψ⟩ = H|Ψ⟩',
  'x = [-b ± √(b²-4ac)] / 2a',
  'f\'(x) = lim [f(x+h)-f(x)]/h',
  '∑ 1/n² = π²/6',
  'a² + b² = c²',
  'sin²θ + cos²θ = 1',
  'log(ab) = log(a) + log(b)',
  'V - E + F = 2',
  '∇ · E = ρ/ε₀',
  'ΔS ≥ 0',
  'F = G(m₁m₂)/r²',
  'd/dx(ln x) = 1/x',
  'H|Ψ⟩ = E|Ψ⟩',
  'A = ½ d₁d₂',
  'A = ½ (a+b)h',
  'C = 2πr',
  'SA = 4πr²',
  'V = πr²h',
  'V = ⅓ πr²h',
  '(a+b)² = a² + 2ab + b²',
  '(a-b)² = a² - 2ab + b²',
  '(a+b)³ = a³ + 3a²b + 3ab² + b³',
  'd = √[(x₂-x₁)² + (y₂-y₁)²]',
  '(x-h)² + (y-k)² = r²',
  'tan θ = sin θ / cos θ',
  'sin(2θ) = 2 sin θ cos θ',
  'cos(2θ) = cos²θ - sin²θ',
  '∫ xⁿ dx = [xⁿ⁺¹ / (n+1)] + C',
  'A = P(1 + r/n)ⁿᵗ',
  'P(A ∪ B) = P(A) + P(B) - P(A ∩ B)',
  'x̄ = (∑ xᵢ) / n'
];

const GRAPH_TYPES = ['sine', 'bell', 'parabola', 'wave'];

const createMathTexture = (content, isGraph) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  
  if (isGraph) {
    // Draw a coordinate system grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 32; x < 480; x += 32) {
      ctx.moveTo(x, 16);
      ctx.lineTo(x, 112);
    }
    for (let y = 16; y < 112; y += 16) {
      ctx.moveTo(32, y);
      ctx.lineTo(480, y);
    }
    ctx.stroke();

    // Draw main axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(32, 64);
    ctx.lineTo(480, 64);
    ctx.moveTo(256, 16);
    ctx.lineTo(256, 112);
    ctx.stroke();

    // Draw the curve
    ctx.strokeStyle = content === 'sine' ? '#38bdf8' : content === 'bell' ? '#c084fc' : '#34d399';
    ctx.lineWidth = 3;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let x = 32; x < 480; x++) {
      const t = (x - 256) / 40;
      let y = 64;
      if (content === 'sine') {
        y = 64 - Math.sin(t * 1.5) * 35;
      } else if (content === 'bell') {
        y = 64 - Math.exp(-t * t * 0.5) * 40;
      } else if (content === 'parabola') {
        y = 64 - (t * t * 0.8 - 20);
      } else if (content === 'wave') {
        y = 64 - Math.sin(t * 3) * Math.exp(-Math.abs(t) * 0.1) * 30;
      }
      if (y >= 16 && y <= 112) {
        if (x === 32) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  } else {
    // Draw centered mathematical text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'italic 34px "Times New Roman", Times, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText(content, 256, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
};

const King = () => {
  const meshRef = useRef();
  const groupRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const { size } = useThree();

  const isMobile = size.width < 768;
  const xPos = isMobile ? 0 : 0.0;
  const yPos = isMobile ? -0.3 : 0.3;
  const scaleFactor = isMobile ? 0.45 : 0.55;

  const points = useMemo(() => {
    const pts = [];
    const segments = 45;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * 4 - 2;
      let r;
      if (t < 0.05) {
        r = 1.3;
      } else if (t < 0.12) {
        r = 1.3 - (t - 0.05) * 3.0;
      } else if (t < 0.45) {
        r = 1.05 - Math.sin((t - 0.12) / 0.33 * Math.PI / 2) * 0.65;
      } else if (t < 0.52) {
        r = 0.4 + Math.sin((t - 0.45) / 0.07 * Math.PI) * 0.25;
      } else if (t < 0.85) {
        const nt = (t - 0.52) / 0.33;
        r = 0.4 + nt * 0.55 + Math.sin(nt * Math.PI) * 0.25;
      } else {
        const tt = (t - 0.85) / 0.15;
        r = 0.95 - tt * 0.95;
      }
      pts.push(new THREE.Vector2(r * 0.75, y));
    }
    return pts;
  }, []);

  useFrame((state) => {
    const elapsedTime = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsedTime * 0.25;
      groupRef.current.position.y = yPos + Math.sin(elapsedTime * 0.75) * 0.12;
      groupRef.current.position.x = xPos;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = elapsedTime * 0.4;
      ring1Ref.current.rotation.y = elapsedTime * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -elapsedTime * 0.3;
      ring2Ref.current.rotation.z = elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[xPos, yPos, 0]} scale={[scaleFactor, scaleFactor, scaleFactor]}>
      {/* Orbiting coordinate rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[1.5, 0.015, 8, 64]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.35} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, -Math.PI / 4, 0]}>
        <torusGeometry args={[1.7, 0.015, 8, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
      </mesh>

      {/* Main Chess King Lathe Wireframe */}
      <mesh ref={meshRef}>
        <latheGeometry args={[points, 32]} />
        <meshBasicMaterial 
          color="#38bdf8" 
          wireframe 
          transparent 
          opacity={0.35} 
          depthWrite={false}
        />
      </mesh>
      
      {/* Secondary inner glowing core mesh */}
      <mesh>
        <latheGeometry args={[points, 16]} />
        <meshBasicMaterial 
          color="#c084fc" 
          wireframe 
          transparent 
          opacity={0.12} 
          depthWrite={false}
        />
      </mesh>

      {/* Top Cross */}
      <group position={[0, 2.15, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.45, 0.08]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.28, 0.08, 0.08]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
};

const Equations = ({ count = 30 }) => {
  const spriteRefs = useRef([]);

  const particles = useMemo(() => {
    const list = [];
    const textures = [];
    MATH_EQUATIONS.forEach((eq) => {
      textures.push({ texture: createMathTexture(eq, false), aspect: 4.0 });
    });
    GRAPH_TYPES.forEach((g) => {
      textures.push({ texture: createMathTexture(g, true), aspect: 4.0 });
    });

    for (let i = 0; i < count; i++) {
      const textureObj = textures[Math.floor(Math.random() * textures.length)];
      const x = (Math.random() - 0.5) * 22;
      const y = (Math.random() - 0.5) * 11;
      const z = -Math.random() * 15;
      const speed = 0.005 + Math.random() * 0.015;
      const noise = Math.random() * 100;
      const size = 0.6 + Math.random() * 0.7;

      list.push({
        position: new THREE.Vector3(x, y, z),
        texture: textureObj.texture,
        aspect: textureObj.aspect,
        speed,
        noise,
        size,
      });
    }
    return list;
  }, [count]);

  useFrame((state) => {
    const elapsedTime = state.clock.getElapsedTime();
    particles.forEach((p, idx) => {
      const sprite = spriteRefs.current[idx];
      if (!sprite) return;

      p.position.z += p.speed;
      p.position.y += Math.sin(elapsedTime * 0.5 + p.noise) * 0.002;

      if (p.position.z > 2.0) {
        p.position.z = -15.0;
        p.position.x = (Math.random() - 0.5) * 22;
        p.position.y = (Math.random() - 0.5) * 11;
      }

      let opacity = 1.0;
      if (p.position.z < -11.0) {
        opacity = (p.position.z + 15.0) / 4.0;
      } else if (p.position.z > -1.0) {
        opacity = 1.0 - (p.position.z + 1.0) / 3.0;
      }
      opacity = Math.max(0, Math.min(0.65, opacity));

      sprite.position.copy(p.position);
      sprite.material.opacity = opacity;
    });
  });

  return (
    <group>
      {particles.map((p, idx) => (
        <sprite
          key={idx}
          ref={(el) => (spriteRefs.current[idx] = el)}
          scale={[p.size * p.aspect, p.size, 1]}
        >
          <spriteMaterial
            attach="material"
            map={p.texture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
};

const InteractiveScene = () => {
  useFrame((state) => {
    const targetX = state.mouse.x * 0.7;
    const targetY = state.mouse.y * 0.5;
    
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY + 0.2, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

const HeroBackground = () => (
  <div className="absolute inset-0 -z-10 bg-navy-900 overflow-hidden">
    <Canvas camera={{ position: [0, 0.2, 5], fov: 60 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <King />
        <Equations count={100} />
        <gridHelper 
          args={[40, 40, '#1e293b', '#020612']} 
          position={[0, -2.3, 0]} 
        />
        <InteractiveScene />
      </Suspense>
    </Canvas>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/40 to-navy-900 pointer-events-none" />
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const channelId = 'UC_Vh4We28mI7QMZsI61ZM6g';
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.status === 'ok') {
          setVideos(data.items.slice(0, 3)); // Get latest 3
        }
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="relative w-full min-h-screen flex items-center overflow-hidden">
        <HeroBackground />
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
           >
             <h1 className="text-5xl md:text-7xl font-bold mb-6 glow-text tracking-tight animate-pulse-slow">
               Mathematics <br />
               <span className="text-gradient font-sans">for Mankind</span>
             </h1>
             <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0">
               Explore the beauty of the universe through the language of mathematics.
               Join our journey to unlock the secrets of geometry, calculus, and beyond.
             </p>
             <div className="flex flex-wrap justify-center lg:justify-start gap-4">
               <button 
                 onClick={() => navigate('/portal')}
                 className="px-8 py-4 rounded-xl font-bold bg-white text-navy-900 hover:bg-slate-200 transition-colors shadow-lg hover:shadow-white/20 cursor-pointer"
               >
                 Start Learning
               </button>
               <button 
                 onClick={() => window.open('https://www.youtube.com/@mathematicsformankind-onlinecl/featured', '_blank')}
                 className="px-8 py-4 rounded-xl font-bold glass glass-hover text-white cursor-pointer"
               >
                 Explore Library
               </button>
             </div>
           </motion.div>

          {/* Youtube Latest */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-panel p-6 border border-white/10 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2 text-white">
              <Play className="text-red-500" fill="currentColor" />
              <span>Latest from YouTube</span>
            </h3>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-slate-400">Loading latest videos...</div>
              ) : videos.length > 0 ? (
                videos.map((video) => (
                  <motion.div
                    key={video.guid}
                    whileHover={{ scale: 1.02, x: 5 }}
                    onClick={() => window.open(video.link, '_blank')}
                    className="flex gap-4 p-3 rounded-xl glass glass-hover cursor-pointer items-center relative z-10"
                  >
                    <div className={`w-32 h-20 rounded-lg shrink-0 bg-navy-900 flex items-center justify-center glow-border relative overflow-hidden`}>
                      <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-black/30" />
                      <Play className="text-white w-8 h-8 z-10 opacity-90 drop-shadow-lg" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h4 className="font-bold text-slate-100 line-clamp-2 leading-tight" dangerouslySetInnerHTML={{ __html: video.title }}></h4>
                      <p className="text-sm text-purple-300 mt-2">{new Date(video.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                  <div className="text-center py-8 text-slate-400">No videos found.</div>
              )}
            </div>
          </motion.div>
        </section>
      </div>

      {/* Author's Bookshelf */}
      <section className="py-20 bg-navy-800/50 backdrop-blur-sm relative border-t border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">The Author's Bookshelf</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Discover comprehensive guides and texts exploring the frontiers of numerical knowledge.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
            {books.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -15, rotateY: 10, rotateX: 5, scale: 1.05 }}
                className="relative group cursor-pointer"
                style={{ perspective: 1000 }}
              >
                {/* Halo Effect Behind Card */}
                <div className={`absolute inset-0 rounded-lg blur-2xl opacity-40 group-hover:opacity-75 transition-opacity duration-500 bg-${book.cover}`} />
                
                {/* Main Card Element */}
                <div className="aspect-[2/3] w-full rounded-lg transition-all duration-300 shadow-xl group-hover:shadow-[0_20px_40px_rgba(107,33,168,0.4)] relative flex flex-col items-center justify-center border overflow-hidden border-white/20 bg-black">
                  {book.image && (
                    <img src={book.image} alt="Photocard" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </div>
                <div className="w-11/12 mx-auto h-4 bg-black/40 blur-md rounded-full mt-4 group-hover:opacity-70 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
