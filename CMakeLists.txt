cmake_minimum_required(VERSION 3.20)
project(Pyxelze VERSION 1.2.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

find_package(Qt6 REQUIRED COMPONENTS Widgets Network Svg)

set(SOURCES
    src/main.cpp
    src/core/AppConstants.h
    src/core/VirtualFile.h
    src/core/Logger.h
    src/core/Logger.cpp
    src/core/RoxRunner.h
    src/core/RoxRunner.cpp
    src/core/ProcessHelper.h
    src/core/ProcessHelper.cpp
    src/archive/ArchiveParser.h
    src/archive/ArchiveParser.cpp
    src/archive/CompressionService.h
    src/archive/CompressionService.cpp
    src/archive/ExtractionService.h
    src/archive/ExtractionService.cpp
    src/helpers/SizeFormatter.h
    src/helpers/SizeFormatter.cpp
    src/helpers/TempHelper.h
    src/helpers/TempHelper.cpp
    src/helpers/UpdateChecker.h
    src/helpers/UpdateChecker.cpp
    src/localization/Localization.h
    src/localization/Localization.cpp
    src/security/PassphraseManager.h
    src/security/PassphraseManager.cpp
    src/platform/PlatformService.h
    src/platform/PlatformService.cpp
    src/ui/ThemeManager.h
    src/ui/ThemeManager.cpp
    src/ui/MainWindow.h
    src/ui/MainWindow.cpp
    src/ui/AboutDialog.h
    src/ui/AboutDialog.cpp
    src/ui/ArchiveInfoDialog.h
    src/ui/ArchiveInfoDialog.cpp
    src/ui/ErrorDialog.h
    src/ui/ErrorDialog.cpp
    src/ui/ProgressDialog.h
    src/ui/ProgressDialog.cpp
    src/ui/PassphraseDialog.h
    src/ui/PassphraseDialog.cpp
    src/ui/IconProvider.h
    src/ui/IconProvider.cpp
    resources/resources.qrc
)

qt_add_executable(pyxelze ${SOURCES})

target_include_directories(pyxelze PRIVATE src)
target_link_libraries(pyxelze PRIVATE Qt6::Widgets Qt6::Network Qt6::Svg)

if(WIN32)
    set_target_properties(pyxelze PROPERTIES WIN32_EXECUTABLE TRUE)
endif()

set(ROXIFY_NATIVE "" CACHE FILEPATH "Path to roxify_native binary")
if(NOT ROXIFY_NATIVE)
    execute_process(
        COMMAND npm root -g
        OUTPUT_VARIABLE NPM_ROOT OUTPUT_STRIP_TRAILING_WHITESPACE
        ERROR_QUIET
    )
    if(NPM_ROOT)
        set(_candidates
            "${NPM_ROOT}/roxify/dist/roxify_native"
            "${NPM_ROOT}/roxify/target/release/roxify_native"
        )
        foreach(_c IN LISTS _candidates)
            if(EXISTS "${_c}")
                set(ROXIFY_NATIVE "${_c}")
                break()
            endif()
        endforeach()
    endif()
endif()

if(ROXIFY_NATIVE AND EXISTS "${ROXIFY_NATIVE}")
    message(STATUS "roxify_native: ${ROXIFY_NATIVE}")
    add_custom_command(TARGET pyxelze POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E make_directory "$<TARGET_FILE_DIR:pyxelze>/roxify"
        COMMAND ${CMAKE_COMMAND} -E copy_if_different "${ROXIFY_NATIVE}" "$<TARGET_FILE_DIR:pyxelze>/roxify/roxify_native"
    )
    install(PROGRAMS "${ROXIFY_NATIVE}" DESTINATION lib/pyxelze RENAME roxify_native)
else()
    message(WARNING "roxify_native not found — set ROXIFY_NATIVE to the binary path")
endif()

install(TARGETS pyxelze RUNTIME DESTINATION bin)
