import * as ts from 'typescript';
import * as fs from 'fs';
interface PassthroughMethodInfo {
  name: string;
  numParameters: number;
  isVoid: boolean;
}
type ClassOrInterface =  ts.ClassDeclaration | ts.InterfaceDeclaration;
function tsAbstractGetMethodInfo(
  classOrInterface: ClassOrInterface,
  sourceFile: ts.SourceFile,
  validMethod: (methodName: string) => boolean): PassthroughMethodInfo[] {

    const methodInfoMap: Map<string, PassthroughMethodInfo> = new Map();
    classOrInterface.members.forEach(m => {
      if (ts.isMethodDeclaration(m)) {
        let addMethod = true;
        const name = m.name.getText(sourceFile);
        if (validMethod(name)) {
          const numParameters = m.parameters.length;
          if (methodInfoMap.has(name)) {
            if (methodInfoMap.get(name).numParameters > numParameters) {
              addMethod = false;
            }
          }
          if (addMethod) {
            methodInfoMap.set(name, {
              isVoid: m.type.kind === ts.SyntaxKind.VoidKeyword,
              numParameters: m.parameters.length,
              name,
            });
          }
        }
      }
    });
    return Array.from(methodInfoMap.values());
}
function generateMock(methodInfos: PassthroughMethodInfo[], mockReturn: object) {
  const mock = {};
  methodInfos.forEach(mi => {
    const mockMethod = jest.fn();
    if (!mi.isVoid) {
      mockMethod.mockReturnValue(mockReturn);
    }
    mock[mi.name] = mockMethod;
  });
  return mock;
}
export function tsPassThroughHelper(
  filePath: string,
  classFinder: (sourceFile: ts.SourceFile) => ClassOrInterface,
  passThrough: (mock: any) => any,
  validMethod: (methodName: string) => boolean) {
    const sourceFile = ts.createSourceFile(
      '',
      fs.readFileSync(filePath).toString(), ts.ScriptTarget.ES2015);

    const classOrInterface = classFinder(sourceFile);
    const methodInfos = tsAbstractGetMethodInfo(classOrInterface, sourceFile, validMethod);
    const mockReturn = {};
    const mock = generateMock(methodInfos, mockReturn);
    const usesMock = passThrough(mock);
    methodInfos.forEach(mi => {
      const methodName = mi.name;
      it(`it should pass through ${methodName}`, () => {
        // tslint:disable-next-line: ban-types
        const method: Function = usesMock[methodName];
        const args = [];
        for (let i = 0; i < mi.numParameters; i++) {
          args.push({});
        }
        const returnValue = method.call(usesMock, ...args);
        if (!mi.isVoid) {
          expect(returnValue).toBe(mockReturn);
        }
        const callArgs = (mock[mi.name] as jest.Mock<any, any>).mock.calls[0];
        expect(callArgs.length).toBe(mi.numParameters);
        if (mi.numParameters > 0) {
          for (let i = 0; i < mi.numParameters; i++) {
            expect(callArgs[i]).toBe(args[i]);
          }
        }
      });
    });
}
