export default function ResursePage() {
  return (
    <div className="p-8 pb-20 gap-16 sm:p-20 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col gap-[32px] items-center text-center max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-800">Resurse SmartLab</h1>
        <p className="text-xl text-gray-700">
          Explorează resursele educaționale disponibile.
        </p>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-medium mb-2 text-gray-800">
              Manual digital
            </h2>
            <p className="text-gray-600 mb-4">
              Accesează manualul digital interactiv pentru această materie.
            </p>
            <button className="mt-auto py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Accesează
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-medium mb-2 text-gray-800">
              Videotutoriale
            </h2>
            <p className="text-gray-600 mb-4">
              Vizionează tutoriale video pentru aprofundarea cunoștințelor.
            </p>
            <button className="mt-auto py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Vizionează
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-medium mb-2 text-gray-800">
              Exerciții practice
            </h2>
            <p className="text-gray-600 mb-4">
              Rezolvă exerciții practice pentru a-ți consolida cunoștințele.
            </p>
            <button className="mt-auto py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Începe
            </button>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-xl font-medium mb-2 text-gray-800">
              Materiale auxiliare
            </h2>
            <p className="text-gray-600 mb-4">
              Descarcă materiale auxiliare pentru studiu individual.
            </p>
            <button className="mt-auto py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Descarcă
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
