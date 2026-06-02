// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View, Text, FlatList, TouchableOpacity,
//   StyleSheet, ActivityIndicator, Alert,
//   Animated, Dimensions, TextInput, StatusBar
// } from 'react-native';
// import api from '../../services/api';

// const { width } = Dimensions.get('window');

// const COLORS = {
//   navy: '#060B12', // Slightly deeper navy
//   blue: '#1A3C6E',
//   accent: '#3897FF', // Brighter, more modern blue
//   light: '#70D7FF',
//   white: '#FFFFFF',
//   glass: 'rgba(255,255,255,0.04)',
//   glassBorder: 'rgba(255,255,255,0.1)',
//   inputBg: 'rgba(255,255,255,0.07)',
//   textMuted: '#8E9AAF',
//   green: '#32E0C4',
//   card: 'rgba(255,255,255,0.03)',
// };

// export default function VehiclesScreen({ navigation }) {
//   const [vehicles, setVehicles] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState('');
  
//   // Animation Values
//   const scrollY = useRef(new Animated.Value(0)).current;
//   const fadeAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     fetchVehicles();
//   }, []);

//   useEffect(() => {
//     const results = vehicles.filter(v =>
//       v.model.toLowerCase().includes(search.toLowerCase()) ||
//       v.type_name.toLowerCase().includes(search.toLowerCase())
//     );
//     setFiltered(results);
//   }, [search, vehicles]);

//   const fetchVehicles = async () => {
//     try {
//       const response = await api.get('/vehicles');
//       setVehicles(response.data.vehicles);
//       setFiltered(response.data.vehicles);
      
//       // Start Fade-in for the container
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }).start();

//     } catch (error) {
//       Alert.alert('Error', 'Could not load vehicles!');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderVehicle = ({ item, index }) => {
//     // Individual Card Animation (Staggered Effect)
//     const translateY = fadeAnim.interpolate({
//       inputRange: [0, 1],
//       outputRange: [50 * (index + 1), 0], // Cards slide up from different positions
//     });

//     return (
//       <Animated.View 
//         style={[
//           styles.cardContainer, 
//           { 
//             opacity: fadeAnim,
//             transform: [{ translateY }] 
//           }
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.card}
//           onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
//           activeOpacity={0.9}
//         >
//           <View style={styles.cardTop}>
//             <View style={styles.carIconBox}>
//               <Text style={styles.carIcon}>🚗</Text>
//             </View>
//             <View style={styles.typeBadge}>
//               <Text style={styles.typeTxt}>{item.type_name.toUpperCase()}</Text>
//             </View>
//           </View>

//           <Text style={styles.model}>{item.model}</Text>
//           <Text style={styles.regNum}>{item.reg_number}</Text>

//           <View style={styles.detailRow}>
//             <View style={styles.detailItem}>
//               <Text style={styles.detailTxt}>🎨 {item.color}</Text>
//             </View>
//             <View style={styles.detailItem}>
//               <Text style={styles.detailTxt}>📅 {item.year}</Text>
//             </View>
//             <View style={styles.availBadge}>
//               <View style={styles.availDot} />
//               <Text style={styles.availTxt}>Available</Text>
//             </View>
//           </View>

//           <View style={styles.divider} />

//           <View style={styles.priceRow}>
//             <View style={styles.priceItem}>
//               <Text style={styles.priceLabel}>Daily Rate</Text>
//               <Text style={styles.priceVal}>Rs. {item.fare_per_day}</Text>
//             </View>
//             <TouchableOpacity
//               style={styles.bookNowBtn}
//               onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
//             >
//               <Text style={styles.bookNowTxt}>Book Now</Text>
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Animated.View>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <StatusBar barStyle="light-content" />
//         <ActivityIndicator size="large" color={COLORS.accent} />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.root}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

//       {/* Animated Header Section */}
//       <Animated.View style={{ opacity: fadeAnim }}>
//         <View style={styles.header}>
//           <View>
//             <Text style={styles.greeting}>Welcome back,</Text>
//             <Text style={styles.headerTitle}>{global.userInfo?.name?.split(' ')[0] || 'User'}</Text>
//           </View>
//           <View style={styles.headerBtns}>
//             <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
//               <Text style={styles.iconBtnTxt}>👤</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={styles.searchBar}>
//           <Text style={styles.searchIcon}>🔍</Text>
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search make or model..."
//             placeholderTextColor={COLORS.textMuted}
//             value={search}
//             onChangeText={setSearch}
//           />
//         </View>

//         <TouchableOpacity
//           style={styles.aiBtn}
//           onPress={() => navigation.navigate('AIRecommend')}
//         >
//           <Text style={styles.aiBtnTxt}>✨ Get AI Recommendations</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//   style={styles.iconBtn}
//   onPress={() => navigation.navigate('NearestDrivers')}
// >
//   <Text style={styles.iconBtnTxt}>🗺️</Text>
// </TouchableOpacity>
//       </Animated.View>

//       <FlatList
//         data={filtered}
//         renderItem={renderVehicle}
//         keyExtractor={(item) => item.vehicle_id.toString()}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
//         ListEmptyComponent={
//           <Text style={styles.emptyTxt}>No luxury rides found.</Text>
//         }
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: COLORS.navy,
//     paddingHorizontal: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: COLORS.navy,
//     justifyContent: 'center',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 60,
//     marginBottom: 25,
//   },
//   greeting: {
//     color: COLORS.textMuted,
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   headerTitle: {
//     color: COLORS.white,
//     fontSize: 28,
//     fontWeight: 'bold',
//   },
//   iconBtn: {
//     width: 45,
//     height: 45,
//     borderRadius: 22.5,
//     backgroundColor: COLORS.glass,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: COLORS.glassBorder,
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.inputBg,
//     borderRadius: 16,
//     paddingHorizontal: 15,
//     height: 55,
//     marginBottom: 15,
//   },
//   searchInput: {
//     flex: 1,
//     color: COLORS.white,
//     fontSize: 16,
//     marginLeft: 10,
//   },
//   aiBtn: {
//     backgroundColor: 'rgba(56, 151, 255, 0.1)',
//     borderRadius: 12,
//     paddingVertical: 12,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(56, 151, 255, 0.3)',
//     marginBottom: 20,
//   },
//   aiBtnTxt: {
//     color: COLORS.accent,
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   cardContainer: {
//     marginBottom: 16,
//   },
//   card: {
//     backgroundColor: COLORS.card,
//     borderRadius: 24,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: COLORS.glassBorder,
//     overflow: 'hidden',
//   },
//   cardTop: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 15,
//   },
//   carIconBox: {
//     width: 50,
//     height: 50,
//     borderRadius: 15,
//     backgroundColor: 'rgba(255,255,255,0.05)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   carIcon: { fontSize: 24 },
//   typeBadge: {
//     backgroundColor: 'rgba(56, 151, 255, 0.15)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 10,
//     height: 28,
//   },
//   typeTxt: {
//     color: COLORS.accent,
//     fontSize: 10,
//     fontWeight: '800',
//     letterSpacing: 1,
//   },
//   model: {
//     color: COLORS.white,
//     fontSize: 22,
//     fontWeight: 'bold',
//   },
//   regNum: {
//     color: COLORS.textMuted,
//     fontSize: 13,
//     marginTop: 2,
//     textTransform: 'uppercase',
//   },
//   detailRow: {
//     flexDirection: 'row',
//     marginTop: 15,
//     alignItems: 'center',
//   },
//   detailTxt: {
//     color: COLORS.textMuted,
//     fontSize: 13,
//     marginRight: 15,
//   },
//   availBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(50, 224, 196, 0.1)',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginLeft: 'auto',
//   },
//   availDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: COLORS.green,
//     marginRight: 6,
//   },
//   availTxt: {
//     color: COLORS.green,
//     fontSize: 11,
//     fontWeight: '700',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: COLORS.glassBorder,
//     marginVertical: 18,
//   },
//   priceRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   priceLabel: {
//     color: COLORS.textMuted,
//     fontSize: 12,
//   },
//   priceVal: {
//     color: COLORS.white,
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   bookNowBtn: {
//     backgroundColor: COLORS.accent,
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 14,
//     shadowColor: COLORS.accent,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   bookNowTxt: {
//     color: COLORS.white,
//     fontWeight: 'bold',
//   },
//   emptyTxt: {
//     textAlign: 'center',
//     color: COLORS.textMuted,
//     marginTop: 50,
//   }
// });








import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  Animated, Dimensions, TextInput, StatusBar,
  LayoutAnimation, UIManager, Platform
} from 'react-native';
import api from '../../services/api';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const COLORS = {
  navy: '#060B12',
  blue: '#1A3C6E',
  accent: '#3897FF',
  light: '#70D7FF',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.1)',
  inputBg: 'rgba(255,255,255,0.07)',
  textMuted: '#8E9AAF',
  green: '#32E0C4',
  card: 'rgba(255,255,255,0.03)',
  categoryBg: 'rgba(56, 151, 255, 0.08)',
};

export default function VehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // State to track which categories are expanded
  const [expandedTypes, setExpandedTypes] = useState({});
  
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    const results = vehicles.filter(v =>
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.type_name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(results);
    
    // Auto-expand categories if user is searching to make results visible
    if (search.length > 0) {
      const allOpen = {};
      results.forEach(v => allOpen[v.type_name] = true);
      setExpandedTypes(allOpen);
    } else {
      setExpandedTypes({}); // Collapse all when search is cleared
    }
  }, [search, vehicles]);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.vehicles);
      setFiltered(response.data.vehicles);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      Alert.alert('Error', 'Could not load vehicles!');
    } finally {
      setLoading(false);
    }
  };

  // Group vehicles by their type_name
  const groupedData = useMemo(() => {
    const groups = {};
    filtered.forEach(vehicle => {
      if (!groups[vehicle.type_name]) {
        groups[vehicle.type_name] = [];
      }
      groups[vehicle.type_name].push(vehicle);
    });
    
    // Convert object to array for FlatList
    return Object.entries(groups).map(([type, items]) => ({
      type,
      vehicles: items
    }));
  }, [filtered]);

  const toggleCategory = (type) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const renderVehicleCard = (item, index) => {
    return (
      <TouchableOpacity
        key={item.vehicle_id || index}
        style={styles.card}
        onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
        activeOpacity={0.9}
      >
        <View style={styles.cardTop}>
          <View style={styles.carIconBox}>
            <Text style={styles.carIcon}>🚗</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeTxt}>{item.type_name.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.model}>{item.model}</Text>
        <Text style={styles.regNum}>{item.reg_number}</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailTxt}>🎨 {item.color}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailTxt}>📅 {item.year}</Text>
          </View>
          <View style={styles.availBadge}>
            <View style={styles.availDot} />
            <Text style={styles.availTxt}>Available</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Daily Rate</Text>
            <Text style={styles.priceVal}>Rs. {item.fare_per_day}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookNowBtn}
            onPress={() => navigation.navigate('VehicleDetail', { vehicle: item })}
          >
            <Text style={styles.bookNowTxt}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = ({ item, index }) => {
    const isExpanded = expandedTypes[item.type];
    
    const translateY = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50 * (index + 1), 0],
    });

    return (
      <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, styles.categorySection]}>
        {/* Category Header (Dropdown Toggle) */}
        <TouchableOpacity 
          style={[styles.categoryHeader, isExpanded && styles.categoryHeaderActive]} 
          onPress={() => toggleCategory(item.type)}
          activeOpacity={0.8}
        >
          <View style={styles.categoryHeaderLeft}>
            <Text style={styles.categoryTitle}>{item.type}</Text>
            <Text style={styles.categoryCount}>{item.vehicles.length} cars</Text>
          </View>
          <View style={styles.iconBtnSmall}>
            <Text style={styles.arrowIcon}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {/* Expanded Vehicles List */}
        {isExpanded && (
          <View style={styles.expandedContainer}>
            {item.vehicles.map((vehicle, vIndex) => renderVehicleCard(vehicle, vIndex))}
          </View>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.headerTitle}>{global.userInfo?.name?.split(' ')[0] || 'User'}</Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.iconBtnTxt}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search make or model..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.actionBtnsRow}>
          <TouchableOpacity
            style={[styles.aiBtn, { flex: 1, marginRight: 10 }]}
            onPress={() => navigation.navigate('AIRecommend')}
          >
            <Text style={styles.aiBtnTxt}>✨ AI Recommendations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('NearestDrivers')}
          >
            <Text style={styles.iconBtnTxt}>🗺️</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <FlatList
        data={groupedData}
        renderItem={renderCategorySection}
        keyExtractor={(item) => item.type}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
        ListEmptyComponent={
          <Text style={styles.emptyTxt}>No luxury rides found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    marginBottom: 25,
  },
  greeting: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerBtns: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  iconBtnTxt: {
    fontSize: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 10,
  },
  actionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiBtn: {
    backgroundColor: 'rgba(56, 151, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 151, 255, 0.3)',
  },
  aiBtnTxt: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  
  /* --- CATEGORY SECTION STYLES --- */
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.categoryBg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  categoryHeaderActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: 'rgba(56, 151, 255, 0.15)',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  categoryCount: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(56, 151, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  iconBtnSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    color: COLORS.white,
    fontSize: 10,
  },
  expandedContainer: {
    paddingTop: 15,
    paddingHorizontal: 5, // Slight indent for vehicles
  },

  /* --- VEHICLE CARD STYLES --- */
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  carIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIcon: { fontSize: 24 },
  typeBadge: {
    backgroundColor: 'rgba(56, 151, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    height: 28,
  },
  typeTxt: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  model: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  regNum: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
  },
  detailItem: {
    marginRight: 15,
  },
  detailTxt: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 224, 196, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginRight: 6,
  },
  availTxt: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  priceVal: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookNowBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bookNowTxt: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyTxt: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 50,
  }
});