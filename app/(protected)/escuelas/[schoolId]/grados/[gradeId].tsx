import React, { useState } from 'react';
import { View, FlatList, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { Button } from '~/src/components/ui/button';
import { SearchInput } from '~/src/components/ui/search-input';
import { StudentCard } from '~/src/components/ui/student-card';
import { Fab } from '~/src/components/ui/fab';
import { BreadcrumbNavigation } from '~/src/components/ui/breadcrumb-navigation';
import { CreateStudentModal } from '~/src/components/ui/create-student-modal';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { useGrade } from '~/src/hooks/data/use-grade-queries';
import { useSchool } from '~/src/hooks/data/use-school-queries';
import { useGradeStudents, useCreateStudent } from '~/src/hooks/data/use-student-queries';
import type { StudentWithDetails } from '~/src/types/database';


export default function GradeDetailScreen() {
  const { schoolId, gradeId } = useLocalSearchParams<{ 
    schoolId: string; 
    gradeId: string; 
  }>();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);

  // Queries
  const { 
    data: school, 
    isLoading: schoolLoading, 
    error: schoolError,
    refetch: refetchSchool
  } = useSchool(schoolId);
  
  const { 
    data: grade, 
    isLoading: gradeLoading, 
    error: gradeError,
    refetch: refetchGrade
  } = useGrade(gradeId);
  
  const { 
    data: studentsData, 
    isLoading: studentsLoading, 
    error: studentsError,
    refetch: refetchStudents
  } = useGradeStudents(gradeId, { limit: 50 });

  const createStudentMutation = useCreateStudent();
  
  const students = studentsData?.data || [];

  const filteredStudents = students.filter(student =>
    (student.fullName || `${student.firstName} ${student.lastName}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchSchool(), refetchGrade(), refetchStudents()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleStudentPress = (student: StudentWithDetails) => {
    router.push(`/(protected)/escuelas/${schoolId}/grados/${gradeId}/estudiante/${student.id}`);
  };

  const handleAddStudent = () => {
    setShowCreateStudentModal(true);
  };

  const handleCreateStudent = async (studentData: any) => {
    try {
      await createStudentMutation.mutateAsync(studentData);
      setShowCreateStudentModal(false);
      Alert.alert('Éxito', 'Estudiante creado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el estudiante. Inténtalo de nuevo.');
    }
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

  const renderStudentItem = ({ item }: { item: StudentWithDetails }) => (
    <StudentCard
      student={item}
      onPress={() => handleStudentPress(item)}
    />
  );

  const isLoading = schoolLoading || gradeLoading || studentsLoading;
  const hasError = schoolError || gradeError || studentsError;

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator 
            size="large" 
            color={isDarkColorScheme ? '#22C55E' : '#16A34A'} 
          />
          <Text className="text-muted-foreground mt-4">
            Cargando información...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (hasError) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-xl font-semibold text-foreground mb-2 text-center">
            Error al cargar datos
          </Text>
          <Text className="text-muted-foreground text-center mb-6">
            {(schoolError || gradeError || studentsError)?.message || 'Ha ocurrido un error inesperado'}
          </Text>
          <Button onPress={handleRefresh}>
            <Text className="text-primary-foreground">Reintentar</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // School or grade not found
  if (!school || !grade) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-xl font-semibold text-foreground mb-2 text-center">
            {!school ? 'Escuela no encontrada' : 'Grado no encontrado'}
          </Text>
          <Text className="text-muted-foreground text-center mb-6">
            {!school 
              ? 'La escuela que buscas no existe o ha sido eliminada.' 
              : 'El grado que buscas no existe o ha sido eliminado.'}
          </Text>
          <Button onPress={() => router.back()}>
            <Text className="text-primary-foreground">Volver</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          items={[
            {
              label: 'Escuelas',
              onPress: () => router.push('/(protected)/escuelas'),
            },
            {
              label: school.name,
              onPress: () => router.push(`/(protected)/escuelas/${schoolId}`),
            },
            {
              label: grade.name,
              isActive: true,
            },
          ]}
        />
      
      {/* Grade Header */}
      <View className="px-6 pb-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-1">
            {grade.name}
          </Text>
          <Text className="text-muted-foreground mb-1">
            {school.name}
          </Text>
          <Text className="text-muted-foreground mb-2">
            {grade.level} • Año académico {grade.academicYear}
          </Text>
          <Text className="text-muted-foreground">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'estudiante' : 'estudiantes'}
            {grade.activeStudents && grade.activeStudents !== grade.studentCount && (
              ` • ${grade.activeStudents} activos`
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
            refreshing={isLoading}
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
      <Fab 
        onPress={handleAddStudent}
        disabled={createStudentMutation.isPending}
      />

      {/* Create Student Modal */}
      <CreateStudentModal
        visible={showCreateStudentModal}
        onClose={() => setShowCreateStudentModal(false)}
        onSave={handleCreateStudent}
        schoolId={schoolId}
        gradeId={gradeId}
        isLoading={createStudentMutation.isPending}
      />
      </View>
    </SafeAreaView>
  );
}