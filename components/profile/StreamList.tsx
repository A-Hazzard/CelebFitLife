export default function StreamList() {
    const streams = [
      { title: 'HIIT Workout', date: 'March 5, 2025', status: 'Upcoming' },
      { title: 'Yoga Flow', date: 'March 1, 2025', status: 'Completed' },
    ];
  
    return (
      <div>
        <h2 className="text-xl text-brandWhite mb-4">Your Streams</h2>
        <div className="space-y-3">
          {streams.map((stream, index) => (
            <div key={index} className="p-4 bg-brandGray rounded-lg flex justify-between items-center">
              <div>
                <h3 className="text-brandWhite font-semibold">{stream.title}</h3>
                <p className="text-sm text-brandWhite">{stream.date}</p>
              </div>
              <span className={`px-3 py-1 text-sm rounded-lg ${stream.status === 'Upcoming' ? 'bg-brandOrange text-brandBlack' : 'bg-brandWhite text-brandBlack'}`}>
                {stream.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  