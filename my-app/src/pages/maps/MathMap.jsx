import GameMapBuilder from '../../components/GameMapBuilder';

export default function MathMap() {
  // Note: Ensure your JSON has subject: "Maths" or "Math" (case insensitive handled by builder)
  return <GameMapBuilder subject="Math" themeColor="indigo" title="Math Kingdom 📐" />;
}