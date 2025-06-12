import { useRouter } from 'next/navigation';
import Head from 'next/head';

export default function IntroScreen() {
  const router = useRouter();
  const handleExit = () => window.location.href = 'https://world-arcade-rho.vercel.app/';
  const handleStart = () => router.push('/game');

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </Head>

      <div className="intro-container">
        <style jsx>{`
          .intro-container{
            min-height:100vh;
            display:flex;align-items:center;justify-content:center;
            image-rendering:pixelated;
            font-family:'Press Start 2P',monospace;
          }
          .panel{
            background:rgba(0,0,0,0.55);
            border:4px solid #000;
            padding:2rem 3rem;text-align:center;
            color:#ffeedd;text-shadow:0 2px 0 #000;
          }
          h1{
            font-size:2rem;margin:0 0 1.2rem;
            color:#fff;text-shadow:0 4px 6px #000;
          }
          h2{font-size:1rem;margin:1rem 0 0.5rem;}
          ul{list-style:square;padding-left:1.2em;margin:0 0 1.5rem;line-height:1.6;}

          .btn{
            display:inline-block;
            padding:0.6em 2.4em;
            margin:0 8px;
            font-size:0.8rem;
            cursor:pointer;
            transition:transform 0.1s,box-shadow 0.1s;
            border:3px solid;
          }
          .start{
            background:#000;
            border-color:#fff;
            color:#fff;
          }
          .btn:hover{
            transform:translateY(-3px);
            box-shadow:0 0 12px #ffffffaa;
          }

          .btn:active{
            transform:translateY(1px) scale(0.97);
            box-shadow:none;
            filter:brightness(0.9);
          }
        `}</style>

        <div className="panel">
          <h1>AMERICAN HERO CHASE</h1>

          <section>
            <h2>Game Rules</h2>
            <ul>
              <li>Use arrow keys to move</li>
              <li>Dodge missiles, tag the villain</li>
              <li>3 stages, each harder</li>
            </ul>
          </section>

          <div>
            <button className="btn start" onClick={handleStart}>START</button>
            <button className="btn exit"  onClick={handleExit}>EXIT</button>
          </div>
        </div>
      </div>
    </>
  );
}
