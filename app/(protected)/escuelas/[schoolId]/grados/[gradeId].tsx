import React, { useState } from 'react';
import { View, FlatList, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { Button } from '~/src/components/ui/button';
import { SearchInput } from '~/src/components/ui/search-input';
import { StudentCard } from '~/src/components/ui/student-card';
import { Fab } from '~/src/components/ui/fab';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

// Mock data - will be replaced with actual data hooks
const mockStudents = [
  {
    id: '1',
    schoolId: '1',
    gradeId: '1',
    firstName: 'María',
    lastName: 'García López',
    studentId: 'EST001',
    email: 'maria.garcia@email.com',
    phone: '(55) 1234-5678',
    status: 'active' as const,
    enrollmentDate: '2024-09-01',
    fullName: 'María García López',
    photoCount: 5,
    paymentCount: 3,
    totalDebt: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    schoolId: '1',
    gradeId: '1',
    firstName: 'Carlos',
    lastName: 'Rodríguez Martín',
    studentId: 'EST002',
    email: 'carlos.rodriguez@email.com',
    phone: '(55) 2345-6789',
    status: 'active' as const,
    enrollmentDate: '2024-09-01',
    fullName: 'Carlos Rodríguez Martín',
    photoCount: 3,
    paymentCount: 2,
    totalDebt: 1500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    schoolId: '1',
    gradeId: '1',
    firstName: 'Ana',
    lastName: 'Sánchez Pérez',
    studentId: 'EST003',
    email: 'ana.sanchez@email.com',
    status: 'active' as const,
    enrollmentDate: '2024-09-01',
    fullName: 'Ana Sánchez Pérez',
    photoCount: 7,
    paymentCount: 4,
    totalDebt: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockGrade = {
  id: '1',
  name: '1° Primaria',
  level: 'Primaria',
  academicYear: '2024-2025',
  studentCount: 25,
  activeStudents: 24,
};

const mockSchool = {
  name: 'Universidad Nacional',
  address: 'Av. Universidad 3000, Coyoacán, CDMX',
};

export default function GradeDetailScreen() {
  const { schoolId, gradeId } = useLocalSearchParams<{ 
    schoolId: string; 
    gradeId: string; 
  }>();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  
  const [students] = useState(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleStudentPress = (student: typeof mockStudents[0]) => {
    router.push(`/(protected)/escuelas/${schoolId}/grados/${gradeId}/estudiante/${student.id}`);
  };

  const handleAddStudent = () => {
    Alert.alert('Agregar Estudiante', 'Funcionalidad en desarrollo...');
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <Text className="text-6xl mb-4">👨‍🎓</Text>
      <Text className="text-xl font-semibold text-foreground mb-2 text-center">
        {searchQuery ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
      </Text>
      <Text className="text-muted-foreground text-center mb-6">
        {searchQuery
          ? `No encontramos estudiantes que coincidan con "${searchQuery}"`
          : 'Comienza agregando el primer estudiante a este grado'}
      </Text>
      {!searchQuery && (
        <View className="w-32">
          <Button onPress={handleAddStudent} className="w-full">
            <Text className="text-primary-foreground font-medium">
              Agregar Estudiante
            </Text>
          </Button>
        </View>
      )}
    </View>
  );

  const renderStudentItem = ({ item }: { item: typeof mockStudents[0] }) => (
    <StudentCard
      student={item}
      onPress={() => handleStudentPress(item)}
    />
  );

  return (
    <View className="flex-1 bg-background pt-6">
      {/* Grade Header */}
      <View className="px-6 pb-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-1">
            {mockGrade.name}
          </Text>
          <Text className="text-muted-foreground mb-1">
            {mockSchool.name}
          </Text>
          <Text className="text-muted-foreground mb-2">
            {mockGrade.level} • Año académico {mockGrade.academicYear}
          </Text>
          <Text className="text-muted-foreground">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'estudiante' : 'estudiantes'}
            {mockGrade.activeStudents !== mockGrade.studentCount && (
              ` • ${mockGrade.activeStudents} activos`
            )}
          </Text>
        </View>
        
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre o ID de estudiante..."
        />
      </View>

      {/* Students List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudentItem}
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
      <Fab onPress={handleAddStudent} />
    </View>
  );
}