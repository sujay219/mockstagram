
import './App.css';
import FollowerGraph from './FollowerGraph';

const influencerIds = ["1000006", "1000007", "1000008"];
function App() {
  return (
   
    <div className="App">
        {/* <FollowerGraph influencerId="1000006"/> */}
        <div className="grid grid-cols-3 grid-rows-3 gap-4 p-4">
        {influencerIds.map((id) => (
          <FollowerGraph key={id} influencerId={id} />
        ))} </div>
    </div>
  );
}

export default App;
