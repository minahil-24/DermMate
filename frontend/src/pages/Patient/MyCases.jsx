export default function MyCases() {
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">My Cases</h1>

      <h2 className="text-lg font-medium mb-3">Active Cases</h2>
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <p className="font-semibold">Hair Loss Case</p>
        <p className="text-sm text-gray-500">Dr. Jane Doe • Ongoing</p>
      </div>

      <h2 className="text-lg font-medium mb-3">Closed Cases</h2>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-semibold">Acne Treatment</p>
        <p className="text-sm text-gray-500">Completed</p>
      </div>
    </section>
  );
}
