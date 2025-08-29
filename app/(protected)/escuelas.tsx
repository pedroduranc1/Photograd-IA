import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  Alert,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { Button } from '~/src/components/ui/button';
import { SearchInput } from '~/src/components/ui/search-input';
import { SchoolCard, type School } from '~/src/components/ui/school-card';
import { Fab } from '~/src/components/ui/fab';
import { SchoolModal } from '~/src/components/ui/school-modal';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { 
  useUserSchools, 
  useCreateSchool, 
  useUpdateSchool, 
  useDeleteSchool 
} from '~/src/hooks/data/use-school-queries';
import { useAuthStore } from '~/src/store/auth-store';
import type { SchoolWithStats } from '~/src/types/database';

export default function EscuelasScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const router = useRouter();
  const { user } = useAuthStore();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolWithStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Queries and mutations
  const { 
    data: schoolsData, 
    isLoading, 
    error, 
    refetch 
  } = useUserSchools(user?.id || '', { limit: 50 });
  
  const createSchoolMutation = useCreateSchool();
  const updateSchoolMutation = useUpdateSchool();
  const deleteSchoolMutation = useDeleteSchool();

  const schools = schoolsData?.data || [];

  // Filtered schools based on search
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    
    const query = searchQuery.toLowerCase().trim();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.address.toLowerCase().includes(query)
    );
  }, [schools, searchQuery]);


  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing schools:', error);
    }
  };

  const handleAddSchool = () => {
    setModalMode('add');
    setSelectedSchool(null);
    setModalVisible(true);
  };

  const handleEditSchool = (school: SchoolWithStats) => {
    setModalMode('edit');
    setSelectedSchool(school);
    setModalVisible(true);
  };

  const handleDeleteSchool = (school: SchoolWithStats) => {
    Alert.alert(
      'Eliminar Escuela',
      `¿Estás seguro de que quieres eliminar "${school.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSchoolMutation.mutateAsync(school.id);
              Alert.alert('Éxito', 'Escuela eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la escuela');
              console.error('Error deleting school:', error);
            }
          },
        },
      ]
    );
  };

  const handleSaveSchool = async (schoolData: Partial<SchoolWithStats>) => {
    if (!user?.id) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }

    try {
      if (modalMode === 'add') {
        const newSchool = {
          ...schoolData,
          id: `school_${Date.now()}`,
          userId: user.id,
          status: 'active' as const,
          debtAmount: 0,
        };
        
        await createSchoolMutation.mutateAsync(newSchool as any);
        Alert.alert('Éxito', 'Escuela agregada correctamente');
      } else if (selectedSchool) {
        await updateSchoolMutation.mutateAsync({
          id: selectedSchool.id,
          updates: schoolData,
        });
        Alert.alert('Éxito', 'Escuela actualizada correctamente');
      }
      
      setModalVisible(false);
      setSelectedSchool(null);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la escuela');
      console.error('Error saving school:', error);
    }
  };

  const handleSchoolPress = (school: SchoolWithStats) => {
    router.push(`/(protected)/escuelas/${school.id}`);
  };

  const handleCall = (school: SchoolWithStats) => {
    if (school.phone) {
      Linking.openURL(`tel:${school.phone}`);
    }
  };

  const handleEmail = (school: SchoolWithStats) => {
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

  const renderSchoolItem = ({ item }: { item: SchoolWithStats }) => (
    <SchoolCard
      school={{
        ...item,
        location: item.address, // Map address to location for compatibility
        grades: [], // Legacy field, not used in new system
      }}
      onPress={() => handleSchoolPress(item)}
      onEdit={() => handleEditSchool(item)}
      onDelete={() => handleDeleteSchool(item)}
      onCall={() => handleCall(item)}
      onEmail={() => handleEmail(item)}
    />
  );

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-background pt-6 justify-center items-center">
        <ActivityIndicator 
          size="large" 
          color={isDarkColorScheme ? '#22C55E' : '#16A34A'} 
        />
        <Text className="text-muted-foreground mt-4">
          Cargando escuelas...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-background pt-6 justify-center items-center px-6">
        <Text className="text-xl font-semibold text-foreground mb-2 text-center">
          Error al cargar escuelas
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          {error.message || 'Ha ocurrido un error inesperado'}
        </Text>
        <Button onPress={handleRefresh}>
          <Text className="text-primary-foreground">Reintentar</Text>
        </Button>
      </View>
    );
  }

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
          placeholder="Buscar por nombre o dirección..."
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
        onPress={handleAddSchool}
        disabled={createSchoolMutation.isPending}
      />

      {/* Add/Edit Modal */}
      <SchoolModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedSchool(null);
        }}
        onSave={handleSaveSchool}
        school={selectedSchool}
        mode={modalMode}
        loading={createSchoolMutation.isPending || updateSchoolMutation.isPending}
      />
    </View>
  );
}