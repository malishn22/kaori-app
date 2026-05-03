import React, { useState } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

type PagedSectionsProps = {
  children: React.ReactNode[];
};

export function PagedSections({ children }: PagedSectionsProps) {
  const { colors } = useTheme();
  const [activePage, setActivePage] = useState(0);
  const pageCount = React.Children.count(children);

  return (
    <>
      <View className="flex-row justify-center gap-1.5 py-3">
        {Array.from({ length: pageCount }, (_, i) => (
          <View
            key={i}
            className="size-1.5 rounded-full"
            style={{
              backgroundColor: activePage === i ? colors.cream : colors.ink4,
              opacity: activePage === i ? 1 : 0.3,
            }}
          />
        ))}
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActivePage(page);
        }}
        style={{ flex: 1 }}
      >
        {React.Children.map(children, child => (
          <View style={{ width: SCREEN_WIDTH }}>{child}</View>
        ))}
      </ScrollView>
    </>
  );
}
