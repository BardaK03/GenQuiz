export default function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Bine ai venit la GenQuiz!
      </h1>
      <p className="text-gray-600 mb-4">
        Selectează o opțiune din meniu pentru a începe.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Lecție</h3>
          <p className="text-gray-600">Învață concepte noi</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Test</h3>
          <p className="text-gray-600">Testează-ți cunoștințele</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Resurse</h3>
          <p className="text-gray-600">Materiale SmartLab</p>
        </div>
      </div>
    </div>
  );
}
