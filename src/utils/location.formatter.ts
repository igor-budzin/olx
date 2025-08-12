const regions = [
  'Голосіївський',
  'Дарницький',
  'Деснянський',
  'Дніпровський',
  'Оболонський',
  'Печерський',
  'Подільський',
  'Святошинський',
  'Солом’янський',
  'Шевченківський'
];

export function locationFormatter(locationString: string): string {
  const locationParts = locationString.split(',').map(part => part.trim());

  if (locationParts.length === 3) {
    const [region, city, area] = locationParts;
    return `${area} район`;
  }

  return locationString;
}