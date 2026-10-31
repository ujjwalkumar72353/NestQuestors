const LANDMARKS = {
  Bengaluru: [["Kempegowda Airport", "Airport", 13.1989, 77.7068], ["KSR Bengaluru Station", "Railway", 12.9784, 77.5718], ["Manyata Tech Park", "Business hub", 13.0475, 77.621], ["Electronic City", "Business hub", 12.8452, 77.6602]],
  Chennai: [["Chennai Airport", "Airport", 12.9941, 80.1709], ["Chennai Central", "Railway", 13.0827, 80.2757], ["Tidel Park", "Business hub", 12.9892, 80.2483]],
  Delhi: [["IGI Airport", "Airport", 28.5562, 77.1], ["New Delhi Station", "Railway", 28.643, 77.2195], ["Connaught Place", "Business hub", 28.6315, 77.2167]],
  Gurugram: [["IGI Airport", "Airport", 28.5562, 77.1], ["Cyber City", "Business hub", 28.495, 77.089], ["Millennium City Centre Metro", "Metro", 28.4595, 77.0723]],
  Hyderabad: [["Rajiv Gandhi Airport", "Airport", 17.2403, 78.4294], ["Secunderabad Station", "Railway", 17.4337, 78.5016], ["Financial District", "Business hub", 17.4125, 78.34]],
  Mumbai: [["Mumbai Airport", "Airport", 19.0896, 72.8656], ["Bandra Kurla Complex", "Business hub", 19.0669, 72.8697], ["Mumbai Central", "Railway", 18.969, 72.8205]],
  Noida: [["Noida City Centre Metro", "Metro", 28.5747, 77.356], ["IGI Airport", "Airport", 28.5562, 77.1], ["Noida Sector 16 Metro", "Metro", 28.5786, 77.3177]],
  Pune: [["Pune Airport", "Airport", 18.5822, 73.9197], ["Pune Junction", "Railway", 18.5289, 73.8743], ["Rajiv Gandhi Infotech Park", "Business hub", 18.5912, 73.7389]],
};

export const AREA_COORDINATES = {
  Bengaluru: { Koramangala: [12.9352, 77.6245], Indiranagar: [12.9719, 77.6412], "HSR Layout": [12.9116, 77.6389], Whitefield: [12.9698, 77.75] },
  Chennai: { Adyar: [13.0012, 80.2565], "T Nagar": [13.0418, 80.2341], Velachery: [12.9815, 80.218], OMR: [12.901, 80.2279] },
  Delhi: { Saket: [28.5245, 77.2066], Dwarka: [28.5921, 77.046], "Lajpat Nagar": [28.5677, 77.2433], Rohini: [28.7383, 77.0822] },
  Gurugram: { "DLF Phase 3": [28.4949, 77.0936], "Sohna Road": [28.4115, 77.0417], "Golf Course Road": [28.4503, 77.0991], "Sector 56": [28.4232, 77.1007] },
  Hyderabad: { "Hitech City": [17.4435, 78.3772], Gachibowli: [17.4401, 78.3489], Madhapur: [17.4483, 78.3915], Kondapur: [17.4698, 78.3578] },
  Mumbai: { "Andheri West": [19.1364, 72.8296], Powai: [19.1176, 72.906], "Bandra East": [19.0607, 72.8558], "Thane West": [19.2183, 72.9781] },
  Noida: { "Sector 62": [28.627, 77.365], "Sector 137": [28.5108, 77.4063], "Sector 18": [28.5708, 77.326], "Sector 76": [28.5738, 77.388] },
  Pune: { Hinjewadi: [18.5912, 73.7389], Baner: [18.559, 73.7868], "Viman Nagar": [18.5679, 73.9143], Kharadi: [18.5515, 73.9348] },
};

export const distanceKm = (lat1, lng1, lat2, lng2) => {
  const radians = (value) => (value * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

// Straight-line distances, nearest first
export const nearbyLandmarks = (city, lat, lng) =>
  (LANDMARKS[city] || [])
    .map(([name, kind, placeLat, placeLng]) => ({
      name,
      kind,
      km: Math.round(distanceKm(lat, lng, placeLat, placeLng) * 10) / 10,
    }))
    .sort((a, b) => a.km - b.km);
