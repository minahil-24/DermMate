export default function Profile() {
  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p><strong>Name:</strong> John Doe</p>
        <p><strong>Email:</strong> john@example.com</p>
        <p><strong>Role:</strong> Patient</p>
      </div>
    </section>
  );
}
