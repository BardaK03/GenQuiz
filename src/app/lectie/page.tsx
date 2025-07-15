export default function LectiePage() {
  return (
    <div className="p-8 pb-20 gap-16 sm:p-20 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col gap-[32px] items-center text-center max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-800">Lecție</h1>
        <p className="text-xl text-gray-700">
          Conținutul lecției va apărea aici.
        </p>

        <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-medium mb-4 text-gray-800">
            Titlul lecției
          </h2>
          <p className="text-gray-700">
            Acesta este un text exemplu pentru o lecție. Aici puteți adăuga
            conținutul educațional pe care doriți să îl prezentați
            utilizatorilor.
          </p>
        </div>
      </div>
    </div>
  );
}
