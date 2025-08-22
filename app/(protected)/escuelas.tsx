import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../../src/components/ui/text';
import { Button } from '../../src/components/ui/button';
import { SearchInput } from '../../src/components/ui/search-input';
import { SchoolCard, type School } from '../../src/components/ui/school-card';
import { Fab } from '../../src/components/ui/fab';
import { SchoolModal } from '../../src/components/ui/school-modal';
import { useColorScheme } from '../../src/hooks/ui/useColorScheme';

// Mock data - replace with actual data source
const mockSchools: School[] = [
  {
    id: '1',
    name: 'Universidad Nacional',
    location: 'Ciudad de México, CDMX',
    address: 'Av. Universidad 3000, Coyoacán, CDMX',
    studentCount: 1200,
    nextGraduation: '15 de Julio, 2025',
    status: 'active',
    phone: '(55) 5622-0000',
    email: 'contacto@unam.mx',
    debtAmount: 0,
    grades: ['Licenciatura', 'Maestría', 'Doctorado'],
  },
  {
    id: '2',
    name: 'Instituto Tecnológico',
    location: 'Guadalajara, Jalisco',
    address: 'Av. Tecnológico 1500, Guadalajara, JAL',
    studentCount: 800,
    nextGraduation: '22 de Julio, 2025',
    status: 'active',
    phone: '(33) 3669-3000',
    email: 'info@itgdl.edu.mx',
    debtAmount: 15000,
    grades: ['Ingeniería', 'Tecnología', 'Innovación'],
  },
  {
    id: '3',
    name: 'Colegio San Patricio',
    location: 'Monterrey, Nuevo León',
    address: 'Calle Educación 456, San Pedro, NL',
    studentCount: 450,
    nextGraduation: '29 de Julio, 2025',
    status: 'active',
    phone: '(81) 8358-2000',
    email: 'admisiones@sanpatricio.edu.mx',
    debtAmount: 0,
    grades: ['Primaria', 'Secundaria', 'Preparatoria'],
  },
  {
    id: '4',
    name: 'Universidad del Valle',
    location: 'Puebla, Puebla',
    address: 'Blvd. Forjadores 1234, Puebla, PUE',
    studentCount: 650,
    nextGraduation: '12 de Agosto, 2025',
    status: 'inactive',
    phone: '(222) 229-5500',
    email: 'contacto@udv.edu.mx',
    debtAmount: 25000,
    grades: ['Licenciatura', 'Posgrado'],
  },
];

export default function EscuelasScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>(mockSchools);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [refreshing, setRefreshing] = useState(false);

  // Filtered schools based on search
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    
    const query = searchQuery.toLowerCase().trim();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.location.toLowerCase().includes(query) ||
        school.grades.some((grade) => grade.toLowerCase().includes(query))
    );
  }, [schools, searchQuery]);


  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAddSchool = () => {
    setModalMode('add');
    setSelectedSchool(null);
    setModalVisible(true);
  };

  const handleEditSchool = (school: School) => {
    setModalMode('edit');
    setSelectedSchool(school);
    setModalVisible(true);
  };

  const handleDeleteSchool = (school: School) => {
    Alert.alert(
      'Eliminar Escuela',
      `¿Estás seguro de que quieres eliminar "${school.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setSchools((prev) => prev.filter((s) => s.id !== school.id));
            Alert.alert('Éxito', 'Escuela eliminada correctamente');
          },
        },
      ]
    );
  };

  const handleSaveSchool = (schoolData: Partial<School>) => {
    if (modalMode === 'add') {
      const newSchool: School = {
        ...schoolData,
        id: Date.now().toString(),
        status: 'active',
        studentCount: schoolData.studentCount || 0,
        grades: schoolData.grades || [],
        debtAmount: 0,
      } as School;
      
      setSchools((prev) => [newSchool, ...prev]);
      Alert.alert('Éxito', 'Escuela agregada correctamente');
    } else {
      setSchools((prev) =>
        prev.map((school) =>
          school.id === schoolData.id ? { ...school, ...schoolData } : school
        )
      );
      
      Alert.alert('Éxito', 'Escuela actualizada correctamente');
    }
  };

  const handleSchoolPress = (school: School) => {
    router.push(`/(protected)/escuela/${school.id}`);
  };

  const handleCall = (school: School) => {
    if (school.phone) {
      Linking.openURL(`tel:${school.phone}`);
    }
  };

  const handleEmail = (school: School) => {
    if (school.email) {
      Linking.openURL(`mailto:${school.email}`);
    }
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <Text className="text-6xl mb-4">🏫</Text>
      <Text className="text-xl font-semibold text-foreground mb-2 text-center">
        {searchQuery ? 'No se encontraron escuelas' : 'No hay escuelas registradas'}
      </Text>
      <Text className="text-muted-foreground text-center mb-6">
        {searchQuery
          ? `No encontramos escuelas que coincidan con "${searchQuery}"`
          : 'Comienza agregando tu primera escuela asociada'}
      </Text>
      {!searchQuery && (
        <View className="w-32">
          <Button onPress={handleAddSchool} className="w-full">
            <Text className="text-primary-foreground font-medium">
              Agregar Escuela
            </Text>
          </Button>
        </View>
      )}
    </View>
  );

  const renderSchoolItem = ({ item }: { item: School }) => (
    <SchoolCard
      school={item}
      onPress={() => handleSchoolPress(item)}
      onEdit={() => handleEditSchool(item)}
      onDelete={() => handleDeleteSchool(item)}
      onCall={() => handleCall(item)}
      onEmail={() => handleEmail(item)}
    />
  );

  return (
    <View className="flex-1 bg-background pt-6">
      {/* Header with Search */}
      <View className="px-6 pb-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-1">
            Escuelas Asociadas
          </Text>
          <Text className="text-muted-foreground">
            {filteredSchools.length} {filteredSchools.length === 1 ? 'escuela' : 'escuelas'}
          </Text>
        </View>
        
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre, ubicación o nivel..."
        />
      </View>

      {/* School List */}
      <FlatList
        data={filteredSchools}
        renderItem={renderSchoolItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 100, // Space for FAB
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDarkColorScheme ? '#22C55E' : '#16A34A'}
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* Floating Action Button */}
      <Fab onPress={handleAddSchool} />

      {/* Add/Edit Modal */}
      <SchoolModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveSchool}
        school={selectedSchool}
        mode={modalMode}
      />
    </View>
  );
}