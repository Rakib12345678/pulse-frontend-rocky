// import coins400 from '@/assets/coins400.svg';
// import coins1250 from '@/assets/coins1250.svg';
// import coins1850 from '@/assets/coins1850.svg';
// import coins2500 from '@/assets/coins2500.svg';
// import coins3750 from '@/assets/coins3750.svg';
// import coins5000 from '@/assets/coins5000.svg';

export interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus: string;
  badge?: 'best-value' | 'popular';
  image: string;
}

// export const coinPackages: CoinPackage[] = [
//   {
//     id: 'pack-400',
//     coins: 400,
//     price: 190,
//     bonus: '100% more',
//     image: coins400,
//   },
//   {
//     id: 'pack-1250',
//     coins: 1250,
//     price: 499,
//     bonus: '150% more',
//     badge: 'best-value',
//     image: coins1250,
//   },
//   {
//     id: 'pack-1800',
//     coins: 1800,
//     price: 799,
//     bonus: '125% more',
//     image: coins1850,
//   },
//   {
//     id: 'pack-2500',
//     coins: 2500,
//     price: 999,
//     bonus: '150% more',
//     badge: 'popular',
//     image: coins2500,
//   },
//   {
//     id: 'pack-3750',
//     coins: 3750,
//     price: 1499,
//     bonus: '150% more',
//     image: coins3750,
//   },
//   {
//     id: 'pack-5000',
//     coins: 5000,
//     price: 1899,
//     bonus: '150% more',
//     image: coins5000,
//   },
// ];
